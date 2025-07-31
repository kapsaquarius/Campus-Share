"use client"

import { useState } from "react"
import { apiService } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function TestApiPage() {
  const [testResults, setTestResults] = useState<any>({})
  const [loading, setLoading] = useState(false)
  const [loginData, setLoginData] = useState({
    username: "testuser",
    password: "password123"
  })

  const testHealthCheck = async () => {
    setLoading(true)
    try {
      const result = await apiService.healthCheck()
      setTestResults(prev => ({ ...prev, health: result }))
    } catch (error) {
      setTestResults(prev => ({ ...prev, health: { error: error.message } }))
    } finally {
      setLoading(false)
    }
  }

  const testLogin = async () => {
    setLoading(true)
    try {
      const result = await apiService.login(loginData.username, loginData.password)
      setTestResults(prev => ({ ...prev, login: result }))
    } catch (error) {
      setTestResults(prev => ({ ...prev, login: { error: error.message } }))
    } finally {
      setLoading(false)
    }
  }

  const testRegister = async () => {
    setLoading(true)
    try {
      const result = await apiService.register({
        username: "newuser" + Date.now(),
        email: "newuser@example.com",
        password: "password123",
        name: "New User"
      })
      setTestResults(prev => ({ ...prev, register: result }))
    } catch (error) {
      setTestResults(prev => ({ ...prev, register: { error: error.message } }))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>API Connection Test</CardTitle>
          <CardDescription>Test the connection between frontend and backend</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={testHealthCheck} disabled={loading}>
              Test Health Check
            </Button>
            <Button onClick={testLogin} disabled={loading}>
              Test Login
            </Button>
            <Button onClick={testRegister} disabled={loading}>
              Test Register
            </Button>
          </div>

          <div className="space-y-4">
            <div>
              <Label>Login Credentials</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  value={loginData.username}
                  onChange={(e) => setLoginData(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="Username"
                />
                <Input
                  type="password"
                  value={loginData.password}
                  onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Password"
                />
              </div>
            </div>

            <div>
              <Label>Test Results</Label>
              <pre className="mt-2 p-4 bg-gray-100 rounded text-sm overflow-auto max-h-96">
                {JSON.stringify(testResults, null, 2)}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 