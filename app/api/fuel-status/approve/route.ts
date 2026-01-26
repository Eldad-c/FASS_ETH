import { createClient } from '@/lib/supabase/server'
import { handleUnknownError, verifyRole } from '@/lib/api-helpers'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const approveSchema = z.object({
  fuelStatusId: z.string().uuid(),
  action: z.enum(['approve', 'reject']),
  notes: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Verify user has manager or admin role
    const { hasAccess, error: roleError } = await verifyRole(supabase, ['admin', 'manager'])
    if (roleError || !hasAccess) {
      return roleError || NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validationResult = approveSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { fuelStatusId, action, notes } = validationResult.data

    // Get the fuel status record
    const { data: fuelStatus, error: fetchError } = await supabase
      .from('fuel_status')
      .select('*')
      .eq('id', fuelStatusId)
      .single()

    if (fetchError || !fuelStatus) {
      return NextResponse.json({ error: 'Fuel status not found' }, { status: 404 })
    }

    // Update fuel status approval
    const updateData: Record<string, unknown> = {
      approval_status: action === 'approve' ? 'APPROVED' : 'REJECTED',
      approved_by: user.id,
      approved_at: new Date().toISOString(),
    }

    if (action === 'reject' && notes) {
      updateData.rejection_reason = notes
    }

    const { error: updateError } = await supabase
      .from('fuel_status')
      .update(updateData)
      .eq('id', fuelStatusId)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Update pending approvals table
    const { error: approvalUpdateError } = await supabase
      .from('pending_approvals')
      .update({
        status: action === 'approve' ? 'APPROVED' : 'REJECTED',
        reviewed_at: new Date().toISOString(),
        review_notes: notes || null,
        manager_id: user.id,
      })
      .eq('id', fuelStatusId)
      .eq('status', 'PENDING')

    if (approvalUpdateError) {
      console.error('Error updating pending approvals:', approvalUpdateError)
    }

    // Create notification for staff member who submitted
    if (fuelStatus.submitted_by) {
      await supabase.from('notifications').insert({
        user_id: fuelStatus.submitted_by,
        title: `Update ${action === 'approve' ? 'Approved' : 'Rejected'}`,
        message: `Your fuel status update for ${fuelStatus.fuel_type} has been ${action === 'approve' ? 'approved' : 'rejected'}.${notes ? ` Notes: ${notes}` : ''}`,
      })
    }

    return NextResponse.json({
      success: true,
      approvalId: fuelStatusId,
      fuelStatusId: fuelStatusId,
      action,
      message: `Update ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
    })
  } catch (error) {
    return handleUnknownError(error)
  }
}
