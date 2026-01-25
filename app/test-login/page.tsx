'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function TestLoginPage() {
  const [status, setStatus] = useState<string>('Ready to test')
  const [details, setDetails] = useState<any>(null)
  const supabase = createClient()

  const testLogin = async () => {
    setStatus('Testing...')
    setDetails(null)

    try {
      // Test 1: Check environment variables
      const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL
      const hasKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!hasUrl || !hasKey) {
        setStatus('ERROR: Missing environment variables')
        setDetails({ hasUrl, hasKey })
        return
      }

      // Test 2: Try to get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError) {
        setStatus('ERROR: ' + userError.message)
        setDetails({ userError })
        return
      }

      if (user) {
        setStatus('SUCCESS: User is logged in')
        setDetails({
          user: {
            id: user.id,
            email: user.email,
          },
        })

        // Test 3: Check profile
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profileError) {
          setDetails((prev: any) => ({
            ...prev,
            profileError: profileError.message,
            profileCode: profileError.code,
          }))
        } else {
          setDetails((prev: any) => ({
            ...prev,
            profile,
          }))
        }

        // Test 4: Try to access cabins
        const { data: cabins, error: cabinsError } = await supabase
          .from('cabins')
          .select('count')
          .limit(1)

        setDetails((prev: any) => ({
          ...prev,
          cabinsAccessible: !cabinsError,
          cabinsError: cabinsError?.message,
        }))
      } else {
        setStatus('INFO: No user logged in')
        setDetails({ message: 'Please log in first' })
      }
    } catch (err: any) {
      setStatus('ERROR: ' + err.message)
      setDetails({ error: err.message, stack: err.stack })
    }
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-4">Login Test Page</h1>
        
        <div className="mb-4">
          <button
            onClick={testLogin}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Run Tests
          </button>
        </div>

        <div className="mb-4">
          <div className={`p-4 rounded ${
            status.startsWith('ERROR') ? 'bg-red-50 text-red-700' :
            status.startsWith('SUCCESS') ? 'bg-green-50 text-green-700' :
            'bg-blue-50 text-blue-700'
          }`}>
            <strong>Status:</strong> {status}
          </div>
        </div>

        {details && (
          <div className="mt-4">
            <h2 className="font-semibold mb-2">Details:</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
              {JSON.stringify(details, null, 2)}
            </pre>
          </div>
        )}

        <div className="mt-6">
          <a
            href="/login"
            className="text-indigo-600 hover:underline"
          >
            ← Go to Login
          </a>
        </div>
      </div>
    </div>
  )
}
