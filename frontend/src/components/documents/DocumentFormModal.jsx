import { useState, useEffect } from 'react'
import Modal from '../ui/Modal'
import Input from '../ui/Input'
import Select from '../ui/Select'
import Button from '../ui/Button'
import { useNotifications } from '../../context/NotificationContext'
import { uploadDocument, updateDocument, getVehicles } from '../../api'

const DOCUMENT_TYPES = [
  { value: 'RC', label: 'Registration Certificate (RC)' },
  { value: 'INSURANCE', label: 'Insurance' },
  { value: 'PUC', label: 'Pollution Certificate (PUC)' },
  { value: 'FITNESS', label: 'Fitness Certificate' },
]

function buildInitial(doc) {
  return {
    vehicleId: doc?.vehicle?.id ?? doc?.vehicleId ?? '',
    type: doc?.type ?? '',
    expiryDate: doc?.expiryDate ?? '',
  }
}

function validate(values) {
  const errs = {}
  if (!values.vehicleId) errs.vehicleId = 'Vehicle is required'
  if (!values.type) errs.type = 'Document type is required'
  if (!values.expiryDate) errs.expiryDate = 'Expiry date is required'
  return errs
}

export default function DocumentFormModal({ open, document, onClose, onCreated }) {
  const isEdit = Boolean(document)
  const { success, error: toastError } = useNotifications()
  const [values, setValues] = useState(() => buildInitial(document))
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [vehicles, setVehicles] = useState([])

  useEffect(() => {
    if (open) {
      setValues(buildInitial(document))
      setErrors({})
      getVehicles()
        .then((data) => setVehicles(data || []))
        .catch(() => setVehicles([]))
    }
  }, [open, document])

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
        vehicleId: Number(values.vehicleId),
        type: values.type,
        expiryDate: values.expiryDate,
      }

      if (isEdit) {
        await updateDocument(document.id, payload)
        success('Document updated', 'The document has been updated.')
      } else {
        await uploadDocument(payload)
        success('Document created', 'The document has been added.')
      }

      onCreated?.()
      onClose?.()
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Something went wrong'
      toastError('Error', msg)
    } finally {
      setSubmitting(false)
    }
  }

  const vehicleOptions = [
    { value: '', label: 'Select vehicle' },
    ...vehicles.map((v) => ({
      value: v.id,
      label: `${v.registrationNo} — ${v.make || ''} ${v.model || ''}`.trim(),
    })),
  ]

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit document' : 'Add document'}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="primary" loading={submitting} onClick={handleSubmit}>
            {isEdit ? 'Save changes' : 'Add document'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Vehicle"
          options={vehicleOptions}
          value={values.vehicleId}
          onChange={set('vehicleId')}
          error={errors.vehicleId}
        />
        <Select
          label="Document type"
          options={DOCUMENT_TYPES}
          value={values.type}
          onChange={set('type')}
          error={errors.type}
        />
        <Input
          label="Expiry date"
          type="date"
          value={values.expiryDate}
          onChange={set('expiryDate')}
          error={errors.expiryDate}
        />
      </form>
    </Modal>
  )
}
