import { ReactNode, useState } from 'react'

export interface Tab {
  key: string
  label: string
  content: ReactNode
}

export interface TabGroupProps {
  tabs: Tab[]
  defaultTab?: string
}

export default function TabGroup({ tabs, defaultTab }: TabGroupProps) {
  const [active, setActive] = useState(defaultTab ?? tabs[0]?.key)
  const current = tabs.find(t => t.key === active)

  return (
    <div>
      <div className="inline-flex bg-gray-100 rounded-xl p-1 gap-0.5">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActive(tab.key)}
            className={`px-4 py-1.5 rounded-[10px] text-sm font-medium transition-all duration-150 ${
              active === tab.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="pt-5">{current?.content}</div>
    </div>
  )
}
