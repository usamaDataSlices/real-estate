import type { TicketFormValues } from '../../types/ticket'
import { TICKET_PRIORITIES, TICKET_STATUSES, TICKET_TYPES } from '../../types/ticket'

type Props = {
  idPrefix: string
  values: TicketFormValues
  compact?: boolean
  onChange: (patch: Partial<TicketFormValues>) => void
}

const inputClass =
  'w-full rounded-md border border-neutral-300 bg-white px-2.5 py-1.5 text-sm outline-none ring-primary/20 focus:border-primary focus:ring-2'
const labelClass = 'mb-1 block text-[11px] font-semibold uppercase tracking-wide text-neutral-500'

export default function TicketFormFields({ idPrefix, values, compact = false, onChange }: Props) {
  return (
    <div className={compact ? 'space-y-3' : 'space-y-4'}>
      <div>
        <label htmlFor={`${idPrefix}-title`} className={labelClass}>
          Summary
        </label>
        <input
          id={`${idPrefix}-title`}
          type="text"
          value={values.title}
          onChange={(event) => onChange({ title: event.target.value })}
          placeholder="What needs to be done?"
          className={inputClass}
          autoFocus
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <label htmlFor={`${idPrefix}-type`} className={labelClass}>
            Type
          </label>
          <select
            id={`${idPrefix}-type`}
            value={values.type}
            onChange={(event) => onChange({ type: event.target.value as TicketFormValues['type'] })}
            className={inputClass}
          >
            {TICKET_TYPES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`${idPrefix}-status`} className={labelClass}>
            Status
          </label>
          <select
            id={`${idPrefix}-status`}
            value={values.status}
            onChange={(event) => onChange({ status: event.target.value as TicketFormValues['status'] })}
            className={inputClass}
          >
            {TICKET_STATUSES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`${idPrefix}-priority`} className={labelClass}>
            Priority
          </label>
          <select
            id={`${idPrefix}-priority`}
            value={values.priority}
            onChange={(event) => onChange({ priority: event.target.value as TicketFormValues['priority'] })}
            className={inputClass}
          >
            {TICKET_PRIORITIES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label htmlFor={`${idPrefix}-assignee`} className={labelClass}>
            Assignee
          </label>
          <input
            id={`${idPrefix}-assignee`}
            type="text"
            value={values.assignee}
            onChange={(event) => onChange({ assignee: event.target.value })}
            placeholder="Name or email"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor={`${idPrefix}-labels`} className={labelClass}>
            Labels
          </label>
          <input
            id={`${idPrefix}-labels`}
            type="text"
            value={values.labels}
            onChange={(event) => onChange({ labels: event.target.value })}
            placeholder="Comma-separated"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor={`${idPrefix}-description`} className={labelClass}>
          Description
        </label>
        <textarea
          id={`${idPrefix}-description`}
          value={values.description}
          onChange={(event) => onChange({ description: event.target.value })}
          placeholder="Add details, steps to reproduce, acceptance criteria…"
          rows={compact ? 4 : 6}
          className={`${inputClass} resize-y`}
        />
      </div>
    </div>
  )
}
