'use client'

import React, { useState } from 'react'
import { Button } from '@/components/buttons/Button'
import { Card } from '@/components/cards/Card'
import { Input } from '@/components/forms/Input'
import { Badge } from '@/components/feedback/Badge'
import { Progress } from '@/components/feedback/Progress'
import { EmptyState } from '@/components/states/EmptyState'
import { ErrorState } from '@/components/states/ErrorState'
import { LoadingSkeleton } from '@/components/states/LoadingSkeleton'

/**
 * Component Demo Page
 * Showcases all components with their variants and states
 */

export default function ComponentsDemo() {
  const [isLoading, setIsLoading] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [selectedValue, setSelectedValue] = useState('option1')
  const [showError, setShowError] = useState(false)
  const [showEmpty, setShowEmpty] = useState(false)

  return (
    <div style={{ padding: 'var(--spacing-2xl)', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ fontSize: 'var(--font-size-h1)', marginBottom: 'var(--spacing-2xl)', color: 'white' }}>
        ChantTracker Component Library
      </h1>

      {/* BUTTONS SECTION */}
      <section style={{ marginBottom: 'var(--spacing-3xl)' }}>
        <h2 style={{ fontSize: 'var(--font-size-h2)', marginBottom: 'var(--spacing-lg)', color: 'white' }}>
          Buttons
        </h2>

        <div style={{ marginBottom: 'var(--spacing-2xl)' }}>
          <h3 style={{ fontSize: 'var(--font-size-h4)', marginBottom: 'var(--spacing-md)', color: 'rgba(255, 255, 255, 0.8)' }}>
            Variants
          </h3>
          <div style={{ display: 'flex', gap: 'var(--spacing-lg)', flexWrap: 'wrap' }}>
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="tertiary">Tertiary</Button>
            <Button variant="ghost">Ghost</Button>
          </div>
        </div>

        <div style={{ marginBottom: 'var(--spacing-2xl)' }}>
          <h3 style={{ fontSize: 'var(--font-size-h4)', marginBottom: 'var(--spacing-md)', color: 'rgba(255, 255, 255, 0.8)' }}>
            Sizes
          </h3>
          <div style={{ display: 'flex', gap: 'var(--spacing-lg)', flexWrap: 'wrap', alignItems: 'center' }}>
            <Button variant="primary" size="sm">Small</Button>
            <Button variant="primary" size="md">Medium</Button>
            <Button variant="primary" size="lg">Large</Button>
          </div>
        </div>

        <div style={{ marginBottom: 'var(--spacing-2xl)' }}>
          <h3 style={{ fontSize: 'var(--font-size-h4)', marginBottom: 'var(--spacing-md)', color: 'rgba(255, 255, 255, 0.8)' }}>
            States
          </h3>
          <div style={{ display: 'flex', gap: 'var(--spacing-lg)', flexWrap: 'wrap', alignItems: 'center' }}>
            <Button variant="primary">Default</Button>
            <Button variant="primary" disabled>Disabled</Button>
            <Button variant="primary" loading>Loading</Button>
            <Button variant="primary" onClick={() => setIsLoading(!isLoading)}>
              {isLoading ? 'Stop' : 'Start'} Loading
            </Button>
          </div>
        </div>
      </section>

      {/* CARDS SECTION */}
      <section style={{ marginBottom: 'var(--spacing-3xl)' }}>
        <h2 style={{ fontSize: 'var(--font-size-h2)', marginBottom: 'var(--spacing-lg)', color: 'white' }}>
          Cards
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--spacing-lg)' }}>
          <Card variant="featured">
            <h3 style={{ fontSize: 'var(--font-size-h4)', margin: '0 0 var(--spacing-md) 0', color: 'white' }}>
              Featured Card
            </h3>
            <p style={{ color: 'rgba(255, 255, 255, 0.7)', margin: 0 }}>
              Brightest variant with maximum opacity
            </p>
          </Card>

          <Card variant="standard">
            <h3 style={{ fontSize: 'var(--font-size-h4)', margin: '0 0 var(--spacing-md) 0', color: 'white' }}>
              Standard Card
            </h3>
            <p style={{ color: 'rgba(255, 255, 255, 0.7)', margin: 0 }}>
              Balanced appearance for most use cases
            </p>
          </Card>

          <Card variant="subtle">
            <h3 style={{ fontSize: 'var(--font-size-h4)', margin: '0 0 var(--spacing-md) 0', color: 'white' }}>
              Subtle Card
            </h3>
            <p style={{ color: 'rgba(255, 255, 255, 0.7)', margin: 0 }}>
              Minimal, subdued appearance
            </p>
          </Card>
        </div>
      </section>

      {/* INPUT SECTION */}
      <section style={{ marginBottom: 'var(--spacing-3xl)' }}>
        <h2 style={{ fontSize: 'var(--font-size-h2)', marginBottom: 'var(--spacing-lg)', color: 'white' }}>
          Input Components
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--spacing-lg)' }}>
          <Input
            label="Text Input"
            type="text"
            placeholder="Enter text..."
            value={inputValue}
            onChange={(e) => setInputValue(e.currentTarget.value)}
            helperText="This is helper text"
          />

          <Input
            label="Email Input"
            type="email"
            placeholder="your@email.com"
            helperText="We'll never share your email"
          />

          <Input
            label="Password Input"
            type="password"
            placeholder="••••••••"
          />

          <Input
            label="Number Input"
            type="number"
            placeholder="Enter a number"
            min="0"
            max="100"
          />

          <Input
            label="With Error"
            type="text"
            error="This field is required"
            placeholder="Showing error state"
          />

          <Input
            label="Disabled Input"
            type="text"
            disabled
            placeholder="This is disabled"
            value="Disabled state"
          />

          <Input
            label="Select Input"
            type="select"
            value={selectedValue}
            onChange={(e) => setSelectedValue(e.currentTarget.value)}
          >
            <option value="option1">Option 1</option>
            <option value="option2">Option 2</option>
            <option value="option3">Option 3</option>
          </Input>

          <Input
            label="Textarea"
            type="textarea"
            placeholder="Enter multiple lines of text..."
            rows={4}
          />
        </div>
      </section>

      {/* BADGES SECTION */}
      <section style={{ marginBottom: 'var(--spacing-3xl)' }}>
        <h2 style={{ fontSize: 'var(--font-size-h2)', marginBottom: 'var(--spacing-lg)', color: 'white' }}>
          Badges
        </h2>

        <div style={{ marginBottom: 'var(--spacing-2xl)' }}>
          <h3 style={{ fontSize: 'var(--font-size-h4)', marginBottom: 'var(--spacing-md)', color: 'rgba(255, 255, 255, 0.8)' }}>
            Variants
          </h3>
          <div style={{ display: 'flex', gap: 'var(--spacing-md)', flexWrap: 'wrap' }}>
            <Badge variant="success">Success</Badge>
            <Badge variant="error">Error</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="info">Info</Badge>
            <Badge variant="neutral">Neutral</Badge>
          </div>
        </div>

        <div>
          <h3 style={{ fontSize: 'var(--font-size-h4)', marginBottom: 'var(--spacing-md)', color: 'rgba(255, 255, 255, 0.8)' }}>
            Sizes
          </h3>
          <div style={{ display: 'flex', gap: 'var(--spacing-md)', flexWrap: 'wrap', alignItems: 'center' }}>
            <Badge variant="success" size="sm">Small</Badge>
            <Badge variant="success" size="md">Medium</Badge>
          </div>
        </div>
      </section>

      {/* PROGRESS SECTION */}
      <section style={{ marginBottom: 'var(--spacing-3xl)' }}>
        <h2 style={{ fontSize: 'var(--font-size-h2)', marginBottom: 'var(--spacing-lg)', color: 'white' }}>
          Progress
        </h2>

        <div style={{ marginBottom: 'var(--spacing-2xl)' }}>
          <h3 style={{ fontSize: 'var(--font-size-h4)', marginBottom: 'var(--spacing-lg)', color: 'rgba(255, 255, 255, 0.8)' }}>
            Linear Progress
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--spacing-lg)' }}>
            <div>
              <label style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 'var(--font-size-body-sm)', marginBottom: 'var(--spacing-sm)', display: 'block' }}>
                0% (Error)
              </label>
              <Progress variant="linear" value={10} showLabel />
            </div>
            <div>
              <label style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 'var(--font-size-body-sm)', marginBottom: 'var(--spacing-sm)', display: 'block' }}>
                35% (Warning)
              </label>
              <Progress variant="linear" value={35} showLabel />
            </div>
            <div>
              <label style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 'var(--font-size-body-sm)', marginBottom: 'var(--spacing-sm)', display: 'block' }}>
                65% (Info)
              </label>
              <Progress variant="linear" value={65} showLabel />
            </div>
            <div>
              <label style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 'var(--font-size-body-sm)', marginBottom: 'var(--spacing-sm)', display: 'block' }}>
                100% (Success)
              </label>
              <Progress variant="linear" value={100} showLabel />
            </div>
          </div>
        </div>

        <div>
          <h3 style={{ fontSize: 'var(--font-size-h4)', marginBottom: 'var(--spacing-lg)', color: 'rgba(255, 255, 255, 0.8)' }}>
            Circular Progress
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 'var(--spacing-lg)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Progress variant="circular" value={10} size="md" />
              <span style={{ color: 'rgba(255, 255, 255, 0.6)', marginTop: 'var(--spacing-md)', fontSize: 'var(--font-size-body-sm)' }}>
                Error
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Progress variant="circular" value={35} size="md" />
              <span style={{ color: 'rgba(255, 255, 255, 0.6)', marginTop: 'var(--spacing-md)', fontSize: 'var(--font-size-body-sm)' }}>
                Warning
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Progress variant="circular" value={65} size="md" />
              <span style={{ color: 'rgba(255, 255, 255, 0.6)', marginTop: 'var(--spacing-md)', fontSize: 'var(--font-size-body-sm)' }}>
                Info
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Progress variant="circular" value={100} size="md" />
              <span style={{ color: 'rgba(255, 255, 255, 0.6)', marginTop: 'var(--spacing-md)', fontSize: 'var(--font-size-body-sm)' }}>
                Success
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* STATE COMPONENTS SECTION */}
      <section style={{ marginBottom: 'var(--spacing-3xl)' }}>
        <h2 style={{ fontSize: 'var(--font-size-h2)', marginBottom: 'var(--spacing-lg)', color: 'white' }}>
          State Components
        </h2>

        <div style={{ marginBottom: 'var(--spacing-2xl)' }}>
          <h3 style={{ fontSize: 'var(--font-size-h4)', marginBottom: 'var(--spacing-md)', color: 'rgba(255, 255, 255, 0.8)' }}>
            Loading Skeleton
          </h3>
          <Card variant="featured">
            <LoadingSkeleton variant="card" count={1} />
          </Card>
        </div>

        <div style={{ marginBottom: 'var(--spacing-2xl)' }}>
          <h3 style={{ fontSize: 'var(--font-size-h4)', marginBottom: 'var(--spacing-md)', color: 'rgba(255, 255, 255, 0.8)' }}>
            Empty State
          </h3>
          <Card variant="featured">
            <EmptyState
              icon="📚"
              heading="No mantras yet"
              description="Start your spiritual journey by adding your first mantra"
              ctaLabel="Add Mantra"
              onCTA={() => setShowEmpty(!showEmpty)}
            />
          </Card>
        </div>

        <div>
          <h3 style={{ fontSize: 'var(--font-size-h4)', marginBottom: 'var(--spacing-md)', color: 'rgba(255, 255, 255, 0.8)' }}>
            Error State
          </h3>
          <Card variant="featured">
            <ErrorState
              message="Failed to load mantras"
              details="Please check your connection and try again"
              onRetry={() => setShowError(!showError)}
            />
          </Card>
        </div>
      </section>

      {/* LAYOUT GRID SECTION */}
      <section style={{ marginBottom: 'var(--spacing-3xl)' }}>
        <h2 style={{ fontSize: 'var(--font-size-h2)', marginBottom: 'var(--spacing-lg)', color: 'white' }}>
          Responsive Grid Example
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--spacing-lg)' }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} variant="standard" interactive>
              <h3 style={{ fontSize: 'var(--font-size-h4)', margin: '0 0 var(--spacing-md) 0', color: 'white' }}>
                Card {i}
              </h3>
              <p style={{ color: 'rgba(255, 255, 255, 0.7)', margin: 0 }}>
                This is a responsive card that adapts to different screen sizes
              </p>
              <Button variant="ghost" size="sm" style={{ marginTop: 'var(--spacing-lg)' }}>
                Learn More
              </Button>
            </Card>
          ))}
        </div>
      </section>

      <footer style={{ marginTop: 'var(--spacing-3xl)', padding: 'var(--spacing-2xl)', borderTop: '1px solid var(--border-color-light)', textAlign: 'center', color: 'rgba(255, 255, 255, 0.6)' }}>
        <p>ChantTracker Component Library - Phase 2 Demo</p>
        <p>All components use design tokens from Phase 1 for consistent styling</p>
      </footer>
    </div>
  )
}
