'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, ScrollText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RuleCard } from '@/components/rules/rule-card'
import { RuleForm } from '@/components/rules/rule-form'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { formatCurrency } from '@/lib/utils'
import type { Rule } from '@/types/database'

interface RulesClientProps {
  rules: Rule[]
  ruleStats: Record<string, { count: number; total: number }>
  groupId: string
  currency: string
  isAdmin: boolean
}

export function RulesClient({ rules, ruleStats, groupId, currency, isAdmin }: RulesClientProps) {
  const [showForm, setShowForm] = useState(false)
  const [editingRule, setEditingRule] = useState<Rule | null>(null)

  const activeRules = rules.filter((r) => r.is_active)
  const disabledRules = rules.filter((r) => !r.is_active)

  // Hall of Shame: top 3 most broken
  const hallOfShame = [...rules]
    .sort((a, b) => (ruleStats[b.id]?.count ?? 0) - (ruleStats[a.id]?.count ?? 0))
    .slice(0, 3)
    .filter((r) => (ruleStats[r.id]?.count ?? 0) > 0)

  function handleEdit(rule: Rule) {
    setEditingRule(rule)
    setShowForm(true)
  }

  function handleClose() {
    setShowForm(false)
    setEditingRule(null)
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-950">Rules</h1>
          <p className="text-zinc-500 text-xs mt-0.5">
            {activeRules.length} active rule{activeRules.length !== 1 ? 's' : ''}
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setShowForm(true)} size="sm">
            <Plus className="h-4 w-4" />
            New Rule
          </Button>
        )}
      </div>

      {/* Most Broken Rules */}
      {hallOfShame.length > 0 && (
        <div className="glass-card rounded-xl p-4 bg-white border border-zinc-200">
          <h3 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-3">
            Most Frequently Broken Rules
          </h3>
          <div className="grid sm:grid-cols-3 gap-2.5">
            {hallOfShame.map((rule, i) => (
              <div
                key={rule.id}
                className="bg-zinc-50 border border-zinc-200 rounded-lg p-3 text-center"
              >
                <div className="text-xs font-semibold text-zinc-600 mb-0.5">
                  Rank #{i + 1}
                </div>
                <p className="text-xs font-semibold text-zinc-950 line-clamp-1">{rule.name}</p>
                <p className="text-[11px] text-zinc-400 mt-1">
                  Broken {ruleStats[rule.id]?.count ?? 0}× ·{' '}
                  {formatCurrency(ruleStats[rule.id]?.total ?? 0, currency)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rules Tabs */}
      {rules.length === 0 ? (
        <div className="glass-card rounded-xl p-10 text-center bg-white border border-zinc-200">
          <ScrollText className="h-10 w-10 text-zinc-300 mx-auto mb-3" />
          <p className="text-zinc-700 font-medium text-sm">No rules defined</p>
          <p className="text-zinc-400 text-xs mt-0.5">Create your first group rule to start tracking fines.</p>
          {isAdmin && (
            <Button onClick={() => setShowForm(true)} className="mt-4" size="sm">
              Create First Rule
            </Button>
          )}
        </div>
      ) : (
        <Tabs defaultValue="active">
          <TabsList>
            <TabsTrigger value="active">Active ({activeRules.length})</TabsTrigger>
            {disabledRules.length > 0 && (
              <TabsTrigger value="disabled">Disabled ({disabledRules.length})</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="active">
            {activeRules.length === 0 ? (
              <div className="glass-card rounded-2xl p-8 text-center text-zinc-400">
                No active rules.
              </div>
            ) : (
              <div className="space-y-3">
                {activeRules.map((rule) => (
                  <RuleCard
                    key={rule.id}
                    rule={rule}
                    fineCount={ruleStats[rule.id]?.count ?? 0}
                    totalGenerated={ruleStats[rule.id]?.total ?? 0}
                    currency={currency}
                    isAdmin={isAdmin}
                    onEdit={handleEdit}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {disabledRules.length > 0 && (
            <TabsContent value="disabled">
              <div className="space-y-3">
                {disabledRules.map((rule) => (
                  <RuleCard
                    key={rule.id}
                    rule={rule}
                    fineCount={ruleStats[rule.id]?.count ?? 0}
                    totalGenerated={ruleStats[rule.id]?.total ?? 0}
                    currency={currency}
                    isAdmin={isAdmin}
                    onEdit={handleEdit}
                  />
                ))}
              </div>
            </TabsContent>
          )}
        </Tabs>
      )}

      {/* Rule Form Modal */}
      <RuleForm
        open={showForm}
        onClose={handleClose}
        groupId={groupId}
        editingRule={editingRule}
      />
    </div>
  )
}
