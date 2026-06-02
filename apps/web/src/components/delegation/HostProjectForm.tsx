'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Trash2 } from 'lucide-react'
import { useGrahas, useCreateProject } from '@/hooks/useDelegation'
import { useAuth } from '@/hooks/useAuth'
import { HostProjectFormData } from '@/types/delegation'

// Validation schema matching backend requirements
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
    .min(2, 'Host priest name must be at least 2 characters')
    .max(100, 'Host priest name must not exceed 100 characters'),
  priestAssignments: z
    .array(
      z.object({
        priestName: z
          .string()
          .min(2, 'Priest name must be at least 2 characters')
          .max(100, 'Priest name must not exceed 100 characters'),
        assignedGrahas: z
          .array(z.string())
          .min(1, 'Each priest must be assigned at least one graha'),
      })
    )
    .min(1, 'Please add at least one priest'),
})

export function HostProjectForm() {
  const router = useRouter()
  const { user } = useAuth()
  const { data: grahas = [], isLoading: grahsLoading } = useGrahas()
  const createProjectMutation = useCreateProject()
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initialize form with React Hook Form
  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<HostProjectFormData>({
    resolver: zodResolver(hostProjectSchema),
    mode: 'onChange',
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

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      router.push('/signin')
    }
  }, [user, router])

  // Handle form submission
  const onSubmit = async (data: HostProjectFormData) => {
    try {
      setFormError(null)
      setIsSubmitting(true)

      // Call backend API through mutation
      const result = await createProjectMutation.mutateAsync(data)

      // Redirect to project page on success
      router.push(`/delegation/projects/${result.project_id}`)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to create project'
      setFormError(message)
      setIsSubmitting(false)
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-bold text-white mb-2">Create Host Project</h1>
      <p className="text-gray-400 mb-8">Set up a new delegation project for client grahas</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Error Message */}
        {formError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {formError}
          </div>
        )}

        {/* Client Name */}
        <div>
          <label htmlFor="clientName" className="block text-sm font-medium text-white mb-2">
            CLIENT NAME
          </label>
          <input
            id="clientName"
            type="text"
            placeholder="Enter client name"
            {...register('clientName')}
            style={{ color: '#000000' }}
            className={`w-full px-4 py-2 border rounded-lg bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 ${
              errors.clientName ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.clientName && (
            <p className="text-red-500 text-sm mt-1">{errors.clientName.message}</p>
          )}
        </div>

        {/* Select Grahas */}
        <div>
          <label className="block text-sm font-medium text-white mb-3">SELECT GRAHAS</label>
          <div className="grid grid-cols-3 gap-3">
            {grahas.map((graha) => (
              <label key={graha.id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  value={graha.id}
                  {...register('selectedGrahas')}
                  className="w-4 h-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                />
                <span className="text-white text-sm">{graha.name}</span>
              </label>
            ))}
          </div>
          {errors.selectedGrahas && (
            <p className="text-red-500 text-sm mt-2">{errors.selectedGrahas.message}</p>
          )}
        </div>

        {/* Host Priest Name */}
        <div>
          <label htmlFor="hostPriestName" className="block text-sm font-medium text-white mb-2">
            HOST PRIEST NAME
          </label>
          <input
            id="hostPriestName"
            type="text"
            placeholder="Enter your name"
            {...register('hostPriestName')}
            style={{ color: '#000000' }}
            className={`w-full px-4 py-2 border rounded-lg bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 ${
              errors.hostPriestName ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.hostPriestName && (
            <p className="text-red-500 text-sm mt-1">{errors.hostPriestName.message}</p>
          )}
        </div>

        {/* Priest Assignments */}
        <div>
          <label className="block text-sm font-medium text-white mb-4">ASSIGN PRIESTS TO GRAHAS</label>
          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="border border-gray-300 rounded-lg p-4 bg-gray-800">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-white font-medium">Priest {index + 1}</h4>
                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="text-red-500 hover:text-red-600 flex items-center gap-1"
                    >
                      <Trash2 size={16} />
                      Remove
                    </button>
                  )}
                </div>

                {/* Priest Name */}
                <div className="mb-4">
                  <label className="block text-sm text-gray-300 mb-2">Priest Name</label>
                  <input
                    type="text"
                    autoComplete="off"
                    placeholder="Enter priest name"
                    {...register(`priestAssignments.${index}.priestName`)}
                    style={{ color: '#000000' }}
                    className={`w-full px-4 py-2 border rounded-lg bg-white text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 ${
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

                {/* Assign Grahas */}
                <div>
                  <label className="block text-sm text-gray-300 mb-2">
                    Assign Grahas ({selectedGrahas.length} available)
                  </label>
                  <div className="space-y-2">
                    {selectedGrahas.length > 0 ? (
                      selectedGrahas.map((grahaId) => {
                        const graha = grahas.find((g) => g.id === grahaId)
                        return (
                          <label
                            key={grahaId}
                            className="flex items-center gap-2 cursor-pointer p-2 hover:bg-gray-700 rounded"
                          >
                            <input
                              type="checkbox"
                              value={grahaId}
                              {...register(`priestAssignments.${index}.assignedGrahas`)}
                              className="w-4 h-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                            />
                            <span className="text-white text-sm">{graha?.name}</span>
                          </label>
                        )
                      })
                    ) : (
                      <p className="text-gray-400 text-sm">Select grahas above first</p>
                    )}
                  </div>
                  {errors.priestAssignments?.[index]?.assignedGrahas && (
                    <p className="text-red-500 text-sm mt-2">
                      {errors.priestAssignments[index]?.assignedGrahas?.message}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {errors.priestAssignments?.root && (
            <p className="text-red-500 text-sm mt-2">{errors.priestAssignments.root.message}</p>
          )}

          <button
            type="button"
            onClick={() => append({ priestName: '', assignedGrahas: [] })}
            className="mt-4 flex items-center gap-2 text-orange-500 hover:text-orange-600 font-medium text-sm"
          >
            <Plus size={16} />
            Add Priest
          </button>
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={isSubmitting || grahsLoading}
            className="flex-1 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white font-medium py-3 rounded-lg transition"
          >
            {isSubmitting ? 'Creating Project...' : 'START'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 rounded-lg transition"
          >
            CANCEL
          </button>
        </div>
      </form>
    </div>
  )
}
