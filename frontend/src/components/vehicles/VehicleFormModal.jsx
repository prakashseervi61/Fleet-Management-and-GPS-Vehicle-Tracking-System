import { useState, useEffect } from 'react'
import Modal from '../ui/Modal'
import Input from '../ui/Input'
import Select from '../ui/Select'
import Button from '../ui/Button'
import { useNotifications } from '../../context/NotificationContext'
import { createVehicle, updateVehicle } from '../../api'

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'BREAKDOWN', label: 'Breakdown' },
  { value: 'RETIRED', label: 'Retired' },
]

function buildInitial(vehicle) {
  return {
    registrationNo: vehicle?.registrationNo ?? '',
    make: vehicle?.make ?? '',
    model: vehicle?.model ?? '',
    gpsDeviceId: vehicle?.gpsDeviceId ?? '',
    currentOdometer: vehicle?.currentOdometer ?? '',
    status: vehicle?.status ?? 'ACTIVE',
    assignedDriverId: vehicle?.assignedDriver?.id ?? '',
  }
}

function validate(values) {
  const errs = {}
  if (!values.registrationNo.trim()) errs.registrationNo = 'Registration number is required'
  if (!values.make.trim()) errs.make = 'Make is required'
  if (!values.model.trim()) errs.model = 'Model is required'
  if (!values.gpsDeviceId.trim()) errs.gpsDeviceId = 'GPS device ID is required'
  if (values.currentOdometer !== '' && Number(values.currentOdometer) < 0) {
    errs.currentOdometer = 'Odometer must be 0 or greater'
  }
  return errs
}

export default function VehicleFormModal({ open, onClose, vehicle, onSaved, drivers }) {
  const isEdit = Boolean(vehicle)
  const { success, error: toastError } = useNotifications()
  const [values, setValues] = useState(() => buildInitial(vehicle))
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setValues(buildInitial(vehicle))
      setErrors({})
    }
  }, [open, vehicle])

  function set(field) {
    return (e) => {
      let val = e.target.value
      if (field === 'registrationNo') val = val.toUpperCase()
      setValues((prev) => ({ ...prev, [field]: val }))
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
        registrationNo: values.registrationNo.trim(),
        make: values.make.trim(),
        model: values.model.trim(),
        gpsDeviceId: values.gpsDeviceId.trim(),
        status: values.status,
        currentOdometer: values.currentOdometer !== '' ? Number(values.currentOdometer) : undefined,
        assignedDriverId: values.assignedDriverId || null,
      }

      if (isEdit) {
        await updateVehicle(vehicle.id, payload)
        success('Vehicle updated', `${payload.registrationNo} has been updated.`)
      } else {
        await createVehicle(payload)
        success('Vehicle registered', `${payload.registrationNo} has been added.`)
      }

      onSaved?.()
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

  const driverOptions = [
    { value: '', label: 'Unassigned' },
    ...(drivers || []).map((d) => ({ value: d.id, label: d.name })),
  ]

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit vehicle' : 'Add vehicle'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="primary" loading={submitting} onClick={handleSubmit}>
            {isEdit ? 'Save changes' : 'Add vehicle'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Registration number"
          placeholder="e.g. MH12AB1234"
          value={values.registrationNo}
          onChange={set('registrationNo')}
          error={errors.registrationNo}
          required
        />
        <Input
          label="Make"
          placeholder="e.g. Tata"
          value={values.make}
          onChange={set('make')}
          error={errors.make}
          required
        />
        <Input
          label="Model"
          placeholder="e.g. Ace Gold"
          value={values.model}
          onChange={set('model')}
          error={errors.model}
          required
        />
        <Input
          label="GPS device ID"
          placeholder="e.g. GPS-001"
          value={values.gpsDeviceId}
          onChange={set('gpsDeviceId')}
          error={errors.gpsDeviceId}
          required
        />
        <Input
          label="Current odometer (km)"
          type="number"
          min="0"
          placeholder="0"
          value={values.currentOdometer}
          onChange={set('currentOdometer')}
          error={errors.currentOdometer}
        />
        <Select
          label="Status"
          options={STATUS_OPTIONS}
          value={values.status}
          onChange={set('status')}
        />
        <div className="sm:col-span-2">
          <Select
            label="Assigned driver"
            options={driverOptions}
            value={values.assignedDriverId}
            onChange={set('assignedDriverId')}
          />
        </div>
      </form>
    </Modal>
  )
}
