import { useState, useEffect } from 'react'
import Modal from '../ui/Modal'
import Input from '../ui/Input'
import Select from '../ui/Select'
import Button from '../ui/Button'
import { useNotifications } from '../../context/NotificationContext'
import { createTrip, getVehicles } from '../../api'

function buildInitial() {
  return {
    vehicleId: '',
    driverId: '',
    origin: '',
    destination: '',
    plannedStart: '',
    distanceKm: '',
  }
}

function validate(values) {
  const errs = {}
  if (!values.vehicleId) errs.vehicleId = 'Vehicle is required'
  if (!values.driverId) errs.driverId = 'Driver is required'
  if (!values.origin.trim()) errs.origin = 'Origin is required'
  if (!values.destination.trim()) errs.destination = 'Destination is required'
  if (!values.plannedStart) errs.plannedStart = 'Planned start is required'
  return errs
}

export default function TripFormModal({ open, onClose, onCreated }) {
  const { success, error: toastError } = useNotifications()
  const [values, setValues] = useState(buildInitial)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [vehicles, setVehicles] = useState([])
  const [vehiclesLoading, setVehiclesLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setValues(buildInitial())
    setErrors({})
    setVehiclesLoading(true)
    getVehicles()
      .then((data) => setVehicles(data || []))
      .catch(() => {})
      .finally(() => setVehiclesLoading(false))
  }, [open])

  function set(field) {
    return (e) => {
      setValues((prev) => {
        const next = { ...prev, [field]: e.target.value }
        if (field === 'vehicleId') {
          const selected = vehicles.find((v) => v.id === e.target.value)
          if (selected?.assignedDriver) {
            next.driverId = selected.assignedDriver.id
          } else {
            next.driverId = ''
          }
        }
        return next
      })
      if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const vehicleOptions = vehicles.map((v) => ({
    value: v.id,
    label: `${v.registrationNo} — ${v.make} ${v.model}`,
  }))

  const driverOptions = vehicles
    .filter((v) => v.assignedDriver)
    .reduce((acc, v) => {
      if (!acc.find((d) => d.value === v.assignedDriver.id)) {
        acc.push({ value: v.assignedDriver.id, label: v.assignedDriver.name })
      }
      return acc
    }, [])

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
        driverId: values.driverId,
        origin: values.origin.trim(),
        destination: values.destination.trim(),
        plannedStart: values.plannedStart,
      }
      await createTrip(payload)
      success('Trip created successfully')
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

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New trip"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="primary" loading={submitting} onClick={handleSubmit}>
            Create trip
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <Select
            label="Vehicle"
            options={[{ value: '', label: vehiclesLoading ? 'Loading vehicles...' : 'Select a vehicle' }, ...vehicleOptions]}
            value={values.vehicleId}
            onChange={set('vehicleId')}
            error={errors.vehicleId}
            disabled={vehiclesLoading}
            required
          />
        </div>
        <div className="sm:col-span-2">
          <Select
            label="Driver"
            options={[{ value: '', label: 'Select a driver' }, ...driverOptions]}
            value={values.driverId}
            onChange={set('driverId')}
            error={errors.driverId}
            required
          />
        </div>
        <Input
          label="Origin"
          placeholder="e.g. Mumbai"
          value={values.origin}
          onChange={set('origin')}
          error={errors.origin}
          required
        />
        <Input
          label="Destination"
          placeholder="e.g. Pune"
          value={values.destination}
          onChange={set('destination')}
          error={errors.destination}
          required
        />
        <Input
          label="Planned start"
          type="datetime-local"
          value={values.plannedStart}
          onChange={set('plannedStart')}
          error={errors.plannedStart}
          required
        />
      </form>
    </Modal>
  )
}
