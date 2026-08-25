import { useState, useEffect } from 'react'
import Modal from '../ui/Modal'
import Input from '../ui/Input'
import Select from '../ui/Select'
import Button from '../ui/Button'
import { useNotifications } from '../../context/NotificationContext'
import { createFuelLog } from '../../api/fuelApi'
import { getVehicles } from '../../api/vehicleApi'
import { getUsers } from '../../api/userApi'

function buildInitial() {
  return {
    vehicleId: '',
    driverId: '',
    quantityLitres: '',
    cost: '',
    date: new Date().toISOString().split('T')[0],
  }
}

function validate(values) {
  const errs = {}
  if (!values.vehicleId) errs.vehicleId = 'Vehicle is required'
  if (!values.driverId) errs.driverId = 'Driver is required'
  if (!values.quantityLitres || Number(values.quantityLitres) <= 0) {
    errs.quantityLitres = 'Quantity must be greater than 0'
  }
  if (!values.cost || Number(values.cost) <= 0) {
    errs.cost = 'Cost must be greater than 0'
  }
  return errs
}

export default function FuelLogFormModal({ open, onClose, onCreated }) {
  const { success, error: toastError } = useNotifications()
  const [values, setValues] = useState(buildInitial)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const [vehicleOptions, setVehicleOptions] = useState([])
  const [driverOptions, setDriverOptions] = useState([])
  const [loadingOptions, setLoadingOptions] = useState(false)

  useEffect(() => {
    if (!open) return
    setValues(buildInitial())
    setErrors({})
    setLoadingOptions(true)
    Promise.all([getVehicles(), getUsers()])
      .then(([vehicles, users]) => {
        setVehicleOptions(
          (vehicles || []).map((v) => ({
            value: v.id,
            label: `${v.registrationNo}${v.make ? ` — ${v.make} ${v.model || ''}` : ''}`.trim(),
          }))
        )
        const drivers = (users || []).filter((u) => u.role === 'DRIVER')
        setDriverOptions(
          drivers.map((d) => ({ value: d.id, label: d.name }))
        )
      })
      .catch(() => {})
      .finally(() => setLoadingOptions(false))
  }, [open])

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
        driverId: values.driverId,
        quantityLitres: Number(values.quantityLitres),
        cost: Number(values.cost),
        date: values.date || undefined,
      }
      await createFuelLog(payload)
      success('Fuel log created', 'The fuel entry has been recorded.')
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
      title="Log fuel"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="primary" loading={submitting} onClick={handleSubmit}>
            Save entry
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <Select
            label="Vehicle"
            options={vehicleOptions}
            value={values.vehicleId}
            onChange={set('vehicleId')}
            placeholder={loadingOptions ? 'Loading vehicles...' : 'Select vehicle'}
            error={errors.vehicleId}
          />
        </div>
        <div className="sm:col-span-2">
          <Select
            label="Driver"
            options={driverOptions}
            value={values.driverId}
            onChange={set('driverId')}
            placeholder={loadingOptions ? 'Loading drivers...' : 'Select driver'}
            error={errors.driverId}
          />
        </div>
        <Input
          label="Quantity (litres)"
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
          value={values.quantityLitres}
          onChange={set('quantityLitres')}
          error={errors.quantityLitres}
          required
        />
        <Input
          label="Cost"
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
          value={values.cost}
          onChange={set('cost')}
          error={errors.cost}
          required
        />
        <div className="sm:col-span-2">
          <Input
            label="Date"
            type="date"
            value={values.date}
            onChange={set('date')}
          />
        </div>
      </form>
    </Modal>
  )
}
