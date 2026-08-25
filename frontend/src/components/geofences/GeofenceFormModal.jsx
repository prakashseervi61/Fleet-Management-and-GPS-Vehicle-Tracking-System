import { useState, useEffect } from 'react'
import Modal from '../ui/Modal'
import Input from '../ui/Input'
import Button from '../ui/Button'
import { Card, CardHeader, CardBody } from '../ui/Card'
import { useNotifications } from '../../context/NotificationContext'
import { createGeofence, updateGeofence } from '../../api'

export default function GeofenceFormModal({ open, geofence, onClose, onCreated }) {
  const editing = Boolean(geofence)
  const { success, error: toastError } = useNotifications()

  const [name, setName] = useState('')
  const [lat, setLat] = useState('')
  const [lng, setLng] = useState('')
  const [radius, setRadius] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setName(geofence?.name ?? '')
      setLat(geofence?.latitude ?? '')
      setLng(geofence?.longitude ?? '')
      setRadius(geofence?.radiusKm ?? '')
    }
  }, [open, geofence])

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        name: name.trim(),
        latitude: Number(lat),
        longitude: Number(lng),
        radiusKm: Number(radius),
      }

      if (editing) {
        await updateGeofence(geofence.id, payload)
        success('Geofence updated', `${payload.name} has been updated.`)
      } else {
        await createGeofence(payload)
        success('Geofence created', `${payload.name} has been added.`)
      }

      onCreated?.()
      onClose?.()
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Something went wrong'
      toastError('Error', msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose}>
      <Card>
        <CardHeader
          title={editing ? 'Edit geofence' : 'New geofence'}
          subtitle="Define a virtual boundary"
        />
        <CardBody>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <Input
                label="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <Input
                label="Latitude"
                type="number"
                step="any"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                required
              />
              <Input
                label="Longitude"
                type="number"
                step="any"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                required
              />
              <Input
                label="Radius (km)"
                type="number"
                step="0.1"
                min="0.1"
                value={radius}
                onChange={(e) => setRadius(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" loading={saving}>
                {editing ? 'Save changes' : 'Create geofence'}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </Modal>
  )
}
