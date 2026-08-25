import { useState, useEffect } from 'react'
import Modal from '../ui/Modal'
import Input from '../ui/Input'
import Select from '../ui/Select'
import Button from '../ui/Button'
import { useNotifications } from '../../context/NotificationContext'
import { createMaintenance, updateMaintenance, getVehicles } from '../../api'

const MAINTENANCE_SERVICE_TYPES = [
  'OIL_CHANGE',
  'TIRE_ROTATION',
  'BRAKE_INSPECTION',
  'ENGINE_SERVICE',
  'TRANSMISSION_SERVICE',
  'GENERAL_SERVICE',
]

const MAINTENANCE_TRIGGERS = ['SCHEDULED', 'ODOMETER', 'BREAKDOWN', 'INSPECTION']

function humanize(str) {
  if (!str) return '—'
  return str
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function buildInitial(order) {
  return {
    vehicleId: order?.vehicle?.id ?? '',
    serviceType: order?.serviceType ?? '',
    trigger: order?.trigger ?? '',
    scheduledDate: order?.scheduledDate ?? '',
    cost: order?.cost ?? '',
  }
}

function validate(values) {
  const errs = {}
  if (!values.vehicleId) errs.vehicleId = 'Vehicle is required'
  if (!values.serviceType) errs.serviceType = 'Service type is required'
  return errs
}

export default function MaintenanceFormModal({ open, onClose, maintenanceOrder, onCreated }) {
  const isEdit = Boolean(maintenanceOrder)
  const { success, error: toastError } = useNotifications()
  const [values, setValues] = useState(() => buildInitial(maintenanceOrder))
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [vehicles, setVehicles] = useState([])

  useEffect(() => {
    if (open) {
      setValues(buildInitial(maintenanceOrder))
      setErrors({})
      getVehicles()
        .then((data) => setVehicles(data || []))
        .catch(() => {})
    }
  }, [open, maintenanceOrder])

  function set(field) {
    return (e) => {
      setValues((prev) => ({ ...prev, [field]: e.target.value }))
      if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate(values)
    if (Object.keys(errs).length) {
      setErrors(errs)
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        vehicleId: values.vehicleId,
        serviceType: values.serviceType,
        trigger: values.trigger || undefined,
        scheduledDate: values.scheduledDate || undefined,
        cost: values.cost !== '' ? Number(values.cost) : undefined,
      }

      if (isEdit) {
        await updateMaintenance(maintenanceOrder.id, payload)
        success('Order updated', 'Maintenance order has been updated.')
      } else {
        await createMaintenance(payload)
        success('Order created', 'Maintenance order has been created.')
      }

      onCreated?.()
      onClose?.()
    } catch (err) {
      const serverErrors = err?.response?.data?.errors || err?.errors
      if (serverErrors && typeof serverErrors === 'object') {
        setErrors((prev) => ({ ...prev, ...serverErrors }))
      }
      const msg = err?.response?.data?.message || err?.message || 'Something went wrong'
      toastError('Error', msg)
    } finally {
      setSubmitting(false)
    }
  }

  const vehicleOptions = vehicles.map((v) => ({
    value: v.id,
    label: `${v.registrationNo} — ${v.make} ${v.model}`,
  }))

  const serviceTypeOptions = MAINTENANCE_SERVICE_TYPES.map((s) => ({
    value: s,
    label: humanize(s),
  }))

  const triggerOptions = MAINTENANCE_TRIGGERS.map((t) => ({
    value: t,
    label: humanize(t),
  }))

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit maintenance order' : 'New maintenance order'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="primary" loading={submitting} onClick={handleSubmit}>
            {isEdit ? 'Save changes' : 'Create order'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <Select
            label="Vehicle"
            options={[{ value: '', label: 'Select vehicle...' }, ...vehicleOptions]}
            value={values.vehicleId}
            onChange={set('vehicleId')}
            error={errors.vehicleId}
          />
        </div>
        <Select
          label="Service type"
          options={[{ value: '', label: 'Select service type...' }, ...serviceTypeOptions]}
          value={values.serviceType}
          onChange={set('serviceType')}
          error={errors.serviceType}
        />
        <Select
          label="Trigger"
          options={[{ value: '', label: 'Select trigger...' }, ...triggerOptions]}
          value={values.trigger}
          onChange={set('trigger')}
        />
        <Input
          label="Scheduled date"
          type="date"
          value={values.scheduledDate}
          onChange={set('scheduledDate')}
        />
        <Input
          label="Cost"
          type="number"
          min="0"
          step="0.01"
          placeholder="0.00"
          value={values.cost}
          onChange={set('cost')}
        />
      </form>
    </Modal>
  )
}
