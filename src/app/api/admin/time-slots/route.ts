import { NextRequest, NextResponse } from 'next/server';

import {
  appendRow,
  updateRow,
} from '@/lib/googleSheets';

import { ExcelStorageManager } from '@/lib/storage';
import { validateAdminRequest } from '@/lib/roleGuard';

/**
 * ============================================================
 * EDUPath - ADMIN TIME SLOTS API
 * ============================================================
 *
 * GET
 *   Returns all configured time slots.
 *
 * POST
 *   action: toggle_slot
 *   action: add_slot
 *
 * Local storage:
 *   ExcelStorageManager
 *
 * Google Sheets:
 *   TimeSlots
 *
 * ============================================================
 */

/**
 * Google Sheets TimeSlots columns:
 *
 * ID
 * Time Slot
 * Enabled
 * Block Date
 */

const SHEET_NAME = 'TimeSlots';

/**
 * Convert any value into a string that is safe
 * for Google Sheets appendRow/updateRow helpers.
 */
function sheetValue(
  value: unknown
): string | number {
  if (
    value === null ||
    value === undefined
  ) {
    return '';
  }

  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'boolean') {
    return value ? 'TRUE' : 'FALSE';
  }

  return String(value);
}

/**
 * ============================================================
 * GET
 * ============================================================
 */
export async function GET(
  request: NextRequest
) {
  try {
    /**
     * --------------------------------------------------------
     * ADMIN AUTH
     * --------------------------------------------------------
     */
    const auth =
      validateAdminRequest(request);

    if (!auth.authorized) {
      return auth.response!;
    }

    /**
     * --------------------------------------------------------
     * STORAGE
     * --------------------------------------------------------
     */
    const leadStore =
      new ExcelStorageManager();

    /**
     * --------------------------------------------------------
     * LOAD TIME SLOTS
     * --------------------------------------------------------
     */
    const slots =
      leadStore.getTimeSlots();

    return NextResponse.json({
      success: true,
      slots,
    });
  } catch (error) {
    console.error(
      'Admin time-slots GET failed:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to load time slots.',
      },
      {
        status: 500,
      }
    );
  }
}

/**
 * ============================================================
 * POST
 * ============================================================
 */
export async function POST(
  request: NextRequest
) {
  try {
    /**
     * --------------------------------------------------------
     * ADMIN AUTH
     * --------------------------------------------------------
     */
    const auth =
      validateAdminRequest(request);

    if (!auth.authorized) {
      return auth.response!;
    }

    /**
     * --------------------------------------------------------
     * REQUEST BODY
     * --------------------------------------------------------
     */
    const body =
      await request.json();

    const action =
      typeof body?.action === 'string'
        ? body.action.trim()
        : '';

    /**
     * --------------------------------------------------------
     * STORAGE
     * --------------------------------------------------------
     */
    const leadStore =
      new ExcelStorageManager();

    /**
     * ========================================================
     * TOGGLE SLOT
     * ========================================================
     */
    if (action === 'toggle_slot') {
      const slotId =
        typeof body?.slotId === 'string'
          ? body.slotId.trim()
          : '';

      if (!slotId) {
        return NextResponse.json(
          {
            success: false,
            message:
              'slotId is required.',
          },
          {
            status: 400,
          }
        );
      }

      /**
       * Convert incoming value to boolean.
       */
      const enabled =
        body?.enabled === true ||
        body?.enabled === 'true';

      /**
       * Optional block date.
       */
      const blockDate =
        body?.blockDate === null ||
        body?.blockDate === undefined
          ? ''
          : String(body.blockDate);

      /**
       * ------------------------------------------------------
       * UPDATE LOCAL STORAGE
       * ------------------------------------------------------
       *
       * Your storage implementation accepts:
       *
       * updateTimeSlot(
       *   slotId,
       *   enabled
       * )
       *
       * Do not pass blockDate here.
       */
      const updatedSlot =
        leadStore.updateTimeSlot(
          slotId,
          enabled
        );

      /**
       * ------------------------------------------------------
       * UPDATE GOOGLE SHEETS
       * ------------------------------------------------------
       *
       * Convert boolean to TRUE/FALSE because the
       * Google Sheets helper expects string | number.
       */
      try {
        await updateRow(
          SHEET_NAME,
          slotId,
          [
            sheetValue(slotId),
            enabled
              ? 'TRUE'
              : 'FALSE',
            sheetValue(blockDate),
          ]
        );
      } catch (sheetError) {
        /**
         * Do not fail the local update if Google Sheets
         * synchronization fails.
         */
        console.error(
          'Google Sheets time-slot update failed:',
          sheetError
        );
      }

      return NextResponse.json({
        success: true,
        message: enabled
          ? 'Time slot enabled successfully.'
          : 'Time slot disabled successfully.',
        slot: updatedSlot,
      });
    }

    /**
     * ========================================================
     * ADD NEW SLOT
     * ========================================================
     */
    if (
      action === 'add_slot' ||
      action === 'add_time_slot'
    ) {
      const timeSlot =
        typeof body?.timeSlot === 'string'
          ? body.timeSlot.trim()
          : '';

      if (!timeSlot) {
        return NextResponse.json(
          {
            success: false,
            message:
              'timeSlot is required.',
          },
          {
            status: 400,
          }
        );
      }

      /**
       * Optional block date.
       */
      const blockDate =
        body?.blockDate === null ||
        body?.blockDate === undefined
          ? ''
          : String(body.blockDate);

      /**
       * ------------------------------------------------------
       * CREATE LOCAL SLOT
       * ------------------------------------------------------
       *
       * IMPORTANT:
       *
       * Your existing method expects:
       *
       * addCustomTimeSlot(timeSlot: string)
       *
       * Therefore we pass ONLY the string.
       */
      const newSlot =
        leadStore.addCustomTimeSlot(
          timeSlot
        );

      /**
       * ------------------------------------------------------
       * GOOGLE SHEETS SYNC
       * ------------------------------------------------------
       */
      try {
        await appendRow(
          SHEET_NAME,
          [
            sheetValue(
              newSlot?.id
            ),

            sheetValue(
              newSlot?.timeSlot
            ),

            newSlot?.enabled
              ? 'TRUE'
              : 'FALSE',

            sheetValue(
              newSlot?.blockDate ??
                blockDate
            ),
          ]
        );
      } catch (sheetError) {
        console.error(
          'Google Sheets time-slot append failed:',
          sheetError
        );

        /**
         * Slot was successfully created locally.
         * Return success but indicate Sheets failure.
         */
        return NextResponse.json({
          success: true,
          message:
            'Time slot created locally, but Google Sheets synchronization failed.',
          slot: newSlot,
          sheetsSynced: false,
        });
      }

      return NextResponse.json({
        success: true,
        message:
          'New time slot added successfully.',
        slot: newSlot,
        sheetsSynced: true,
      });
    }

    /**
     * ========================================================
     * INVALID ACTION
     * ========================================================
     */
    return NextResponse.json(
      {
        success: false,
        message:
          'Invalid action. Use "toggle_slot" or "add_slot".',
      },
      {
        status: 400,
      }
    );
  } catch (error) {
    console.error(
      'Admin time-slots POST failed:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to process time slot request.',
      },
      {
        status: 500,
      }
    );
  }
}