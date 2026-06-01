'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Trash2 } from 'lucide-react'
import { useGrahas, useCreateProject } from '@/hooks/useDelegation'
import { useAuth } from '@/hooks/useAuth'
import { HostProjectFormData, PriestAssignment } from '@/types/delegation'

const hostProjectSchema = z.object({
  clientName: z
    .string()
    .min(2, 'Client name must be at least 2 characters')
    .max(100, 'Client name must not exceed 100 characters'),
  selectedGrahas: z
    .array(z.string())
    .min(1, 'Please select at least one graha'),
  hostPriestName: z
    .string()
    .min(2, 'Priest name must be at least 2 characters')
    .max(100, 'Priest name must not exceed 100 characters'),
  priestAssignments: z
    .array(
      z.object({
        priestName: z
          .string()
          .min(2, 'Priest name must be at least 2 characters'),
        assignedGrahas: z
          .array(z.string())
          .min(1, 'Each priest must be assigned at least one graha'),
      })
    )
    .min(1, 'Please add at least one priest assignment'),
})

export function HostProjectForm() {
  const router = useRouter()
  const { user } = useAuth()
  const { data: grahas = [], isLoading: grahsLoading } = useGrahas()
  const createProjectMutation = useCreateProject()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<HostProjectFormData>({
    resolver: zodResolver(hostProjectSchema),
    defaultValues: {
      clientName: '',
      selectedGrahas: [],
      hostPriestName: '',
      priestAssignments: [{ priestName: '', assignedGrahas: [] }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'priestAssignments',
  })

  const selectedGrahas = watch('selectedGrahas')
  const priestAssignments = watch('priestAssignments')

  // Store refs for each priest assignment dropdown
  const dropdownRefsMap = useRef<Record<number, HTMLDetailsElement | null>>({})

  useEffect(() => {
    if (!user) {
      router.push('/signin')
    }
  }, [user, router])

  // Handle click-outside for all dropdown refs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      Object.values(dropdownRefsMap.current).forEach((dropdownRef) => {
        if (
          dropdownRef &&
          !dropdownRef.contains(event.target as Node)
        ) {
          dropdownRef.open = false
        }
      })
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const onSubmit = async (data: HostProjectFormData) => {
    try {
      setFormError(null)

      // Validate that at least one priest has assignments
      const hasValidAssignment = data.priestAssignments.some(
        (pa) => pa.assignedGrahas.length > 0
      )
      if (!hasValidAssignment) {
        setFormError(
          'Please assign at least one graha to one priest'
        )
        return
      }

      const result = await createProjectMutation.mutateAsync(data)

      // Show success message and redirect
      router.push(`/delegation/projects/${result.project_id}`)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to create project'
      setFormError(message)
      console.error('Form submission error:', error)
    }
  }

  const isLoading = grahsLoading || isSubmitting || createProjectMutation.isPending

  if (!user) {
    return null
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl text-white">
      {formError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {formError}
        </div>
      )}

      {/* Client Name Section */}
      <div>
        <label
          htmlFor="clientName"
          className="block text-sm font-medium mb-2 text-white"
        >
          CLIENT NAME
        </label>
        <input
          id="clientName"
          type="text"
          placeholder="Enter client name..."
          {...register('clientName')}
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 !text-slate-900 bg-white placeholder-gray-400 ${
            errors.clientName ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.clientName && (
          <p className="text-red-500 text-sm mt-1">
            {errors.clientName.message}
          </p>
        )}
      </div>

      {/* Grahas Section */}
      <div className="grid grid-cols-3 gap-3">
        {grahas.map((graha) => (
          <div
            key={graha.id}
            className="flex items-center gap-2"
          >
            <Controller
              name="selectedGrahas"
              control={control}
              render={({ field }) => (
                <>
                  <input
                    type="checkbox"
                    checked={field.value.includes(graha.id)}
                    onChange={(e) => {
                      const newValue = e.target.checked
                        ? [...field.value, graha.id]
                        : field.value.filter((id) => id !== graha.id)
                      field.onChange(newValue)
                    }}
                    className="w-4 h-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                  />
                  <button
                    type="button"
                    disabled
                    className="px-2 py-1 text-sm bg-gray-700 text-white rounded cursor-default border border-gray-600 opacity-75"
                  >
                    {graha.name}
                  </button>
                </>
              )}
            />
          </div>
        ))}
      </div>
      {errors.selectedGrahas && (
        <p className="text-red-500 text-sm mt-1">
          {errors.selectedGrahas.message}
        </p>
      )}

      {/* Host Priest Name Section */}
      <div>
        <label
          htmlFor="hostPriestName"
          className="block text-sm font-medium mb-2 text-white"
        >
          HOST PRIEST NAME
        </label>
        <input
          id="hostPriestName"
          type="text"
          placeholder="Enter your name..."
          {...register('hostPriestName')}
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 !text-slate-900 bg-white placeholder-gray-400 ${
            errors.hostPriestName ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.hostPriestName && (
          <p className="text-red-500 text-sm mt-1">
            {errors.hostPriestName.message}
          </p>
        )}
      </div>

      {/* Priest Assignments Section */}
      <div>
        <label className="block text-sm font-medium mb-2 text-white">
          ASSIGN PRIESTS TO GRAHAS
        </label>
        <div className="space-y-4">
          {fields.map((field, index) => (
            <div key={field.id} className="p-4 border border-gray-300 rounded-lg bg-white">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-white">
                  Priest {index + 1}
                </span>
                {fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="text-red-600 hover:text-red-700 text-sm flex items-center gap-1"
                  >
                    <Trash2 size={16} />
                    Remove
                  </button>
                )}
              </div>

              {/* Priest Name Input */}
              <div className="mb-3">
                <input
                  type="text"
                  placeholder="Priest name..."
                  {...register(`priestAssignments.${index}.priestName`)}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 !text-slate-900 bg-white placeholder-gray-400 ${
                    errors.priestAssignments?.[index]?.priestName
                      ? 'border-red-500'
                      : 'border-gray-300'
                  }`}
                />
                {errors.priestAssignments?.[index]?.priestName && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.priestAssignments[index]?.priestName?.message}
                  </p>
                )}
              </div>

              {/* Grahas Multiselect Dropdown for Priest Assignment */}
              <Controller
                name={`priestAssignments.${index}.assignedGrahas`}
                control={control}
                render={({ field }) => (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">
                      Select Grahas for {priestAssignments[index]?.priestName || `Priest ${index + 1}`}
                    </label>
                    {selectedGrahas.length > 0 ? (
                      <div className="relative">
                        <details ref={(el) => {
                          if (el) dropdownRefsMap.current[index] = el
                        }} className="group">
                          <summary className="cursor-pointer px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm list-none hover:bg-gray-50">
                            <div className="flex items-center justify-between">
                              <span>
                                {field.value.length} of {selectedGrahas.length} selected
                              </span>
                              <span className="text-gray-400 group-open:rotate-180 transition-transform">
                                ▼
                              </span>
                            </div>
                          </summary>
                          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
                            {selectedGrahas.map((grahaId) => {
                              const graha = grahas.find((g) => g.id === grahaId)
                              const isSelected = field.value.includes(grahaId)
                              return (
                                <label
                                  key={grahaId}
                                  className="flex items-center px-3 py-2 border-b border-gray-100 hover:bg-orange-50 cursor-pointer"
                                >
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={(e) => {
                                      const newValue = e.target.checked
                                        ? [...field.value, grahaId]
                                        : field.value.filter((id) => id !== grahaId)
                                      field.onChange(newValue)
                                    }}
                                    className="w-4 h-4 rounded border-gray-300 text-orange-600 cursor-pointer"
                                  />
                                  <span className="ml-2 text-sm text-gray-900">
                                    {graha?.name}
                                  </span>
                                </label>
                              )
                            })}
                          </div>
                        </details>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 py-2">
                        Select grahas above to assign to this priest
                      </p>
                    )}
                  </div>
                )}
              />
              {errors.priestAssignments?.[index]?.assignedGrahas && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.priestAssignments[index]?.assignedGrahas?.message}
                </p>
              )}
            </div>
          ))}
        </div>

        {errors.priestAssignments && (
          <p className="text-red-500 text-sm mt-1">
            {errors.priestAssignments.message}
          </p>
        )}

        {/* Add More Priests Button */}
        <button
          type="button"
          onClick={() =>
            append({ priestName: '', assignedGrahas: [] })
          }
          className="mt-4 flex items-center gap-2 px-4 py-2 text-orange-600 hover:text-orange-700 font-medium text-sm"
        >
          <Plus size={16} />
          Add More Priests
        </button>
      </div>

      {/* Form Actions */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white font-medium py-3 rounded-lg transition"
        >
          {isLoading
            ? createProjectMutation.isPending
              ? 'Creating Project...'
              : 'Loading...'
            : 'START'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 font-medium py-3 rounded-lg transition"
        >
          CANCEL
        </button>
      </div>
    </form>
  )
}
