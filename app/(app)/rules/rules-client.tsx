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
          <h1 className="text-2xl font-bold text-white">📜 Rules</h1>
          <p className="text-white/40 text-sm mt-1">
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

      {/* Hall of Shame */}
      {hallOfShame.length > 0 && (
        <div className="glass-card rounded-2xl p-5 border border-red-500/10">
          <h3 className="text-sm font-semibold text-white/60 uppercase tracking-widest mb-4">
            🔥 Hall of Shame — Most Broken Rules
          </h3>
          <div className="grid sm:grid-cols-3 gap-3">
            {hallOfShame.map((rule, i) => (
              <motion.div
                key={rule.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-red-500/5 border border-red-500/15 rounded-xl p-4 text-center"
              >
                <div className="text-2xl mb-1">
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}
                </div>
                <p className="text-sm font-semibold text-white line-clamp-1">{rule.name}</p>
                <p className="text-xs text-white/40 mt-1">
                  Broken {ruleStats[rule.id]?.count ?? 0}× ·{' '}
                  {formatCurrency(ruleStats[rule.id]?.total ?? 0, currency)}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Rules Tabs */}
      {rules.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <ScrollText className="h-12 w-12 text-white/20 mx-auto mb-4" />
          <p className="text-white/50">No rules yet.</p>
          <p className="text-white/30 text-sm mt-1">📜 Pure anarchy.</p>
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
              <div className="glass-card rounded-2xl p-8 text-center text-white/40">
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
