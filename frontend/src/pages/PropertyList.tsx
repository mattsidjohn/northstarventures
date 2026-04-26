import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Property } from '@northstar/shared-types'
import Header from '../components/layout/Header'
import PageContainer from '../components/layout/PageContainer'
import SortableTable, { ColumnDef } from '../components/ui/SortableTable'
import EmptyState from '../components/ui/EmptyState'
import ConfirmModal from '../components/ui/ConfirmModal'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { useProperties } from '../hooks/useProperties'
import { formatCurrency } from '../utils/format'
import { api } from '../api/client'

export default function PropertyList() {
  const navigate = useNavigate()
  const { properties, loading, deleteProperty } = useProperties()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)

  async function handleExport() {
    setExporting(true)
    await api.backup.export().finally(() => setExporting(false))
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      await api.backup.import(data)
      window.location.reload()
    } catch {
      alert('Import failed. Please check the file format.')
    } finally {
      setImporting(false)
      e.target.value = ''
    }
  }

  const columns: ColumnDef<Property>[] = [
    {
      key: 'name',
      header: 'Property',
      sortValue: p => p.name,
      render: p => (
        <div>
          <p className="font-medium text-gray-900">{p.name}</p>
          <p className="text-xs text-gray-400">{p.address}</p>
        </div>
      ),
    },
    {
      key: 'units',
      header: 'Units',
      sortValue: p => p.units,
      render: p => p.units,
    },
    {
      key: 'type',
      header: 'Type',
      sortValue: p => p.propertyType,
      render: p => <span className="capitalize">{p.propertyType.replace('-', ' ')}</span>,
    },
    {
      key: 'purchasePrice',
      header: 'Purchase Price',
      sortValue: p => p.purchasePrice,
      render: p => formatCurrency(p.purchasePrice),
    },
    {
      key: 'currentValue',
      header: 'Current Value',
      sortValue: p => p.estimatedCurrentValue,
      render: p => formatCurrency(p.estimatedCurrentValue),
    },
    {
      key: 'actions',
      header: '',
      render: p => (
        <button
          onClick={e => { e.stopPropagation(); setDeleteId(p.id) }}
          className="text-xs text-red-500 hover:underline"
        >
          Delete
        </button>
      ),
    },
  ]

  return (
    <div>
      <Header
        title="Properties"
        subtitle={`${properties.length} properties`}
        actions={
          <div className="flex gap-2">
            <label className="px-4 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors cursor-pointer">
              {importing ? 'Importing…' : 'Import'}
              <input type="file" accept=".json" className="hidden" onChange={handleImportFile} />
            </label>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="px-4 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              {exporting ? 'Exporting…' : 'Export'}
            </button>
            <button
              onClick={() => navigate('/properties/new')}
              className="px-4 py-2.5 text-sm font-semibold text-white bg-brand-500 rounded-xl hover:bg-brand-600 transition-colors shadow-sm"
            >
              + Add Property
            </button>
          </div>
        }
      />
      <PageContainer>
        {loading ? (
          <LoadingSpinner size="lg" className="mt-20" />
        ) : properties.length === 0 ? (
          <EmptyState
            icon="🏠"
            title="No properties yet"
            description="Add your first property to begin tracking performance."
            action={
              <button
                onClick={() => navigate('/properties/new')}
                className="px-5 py-2.5 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600"
              >
                Add Property
              </button>
            }
          />
        ) : (
          <SortableTable
            columns={columns}
            data={properties}
            rowKey={p => p.id}
            onRowClick={p => navigate(`/properties/${p.id}`)}
          />
        )}
      </PageContainer>

      {deleteId && (
        <ConfirmModal
          title="Delete Property"
          message="This will permanently delete the property and all its monthly data and scorecards. This cannot be undone."
          confirmLabel="Delete"
          destructive
          onConfirm={async () => {
            await deleteProperty(deleteId)
            setDeleteId(null)
          }}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  )
}
