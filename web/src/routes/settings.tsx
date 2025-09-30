import { createFileRoute } from '@tanstack/react-router'
import { DeleteDataDialog } from '@/components/DeleteDataDialog'
import { useAuth } from '@/contexts/AuthContext'

export const Route = createFileRoute('/settings')({
  component: SettingsComponent,
})

function SettingsComponent() {
  const { user } = useAuth()
  
  const handleDeleteSuccess = () => {
    // Optionally refresh the page or redirect after deletion
    window.location.reload()
  }
  
  return (
    <div className="container mx-auto max-w-2xl py-12 space-y-8">
      <h1 className="text-4xl font-bold text-center text-primary">
        Account Settings
      </h1>
      
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Account Information</h2>
          <p className="text-muted-foreground">Username: {user?.username}</p>
          <p className="text-muted-foreground">Email: {user?.email}</p>
        </div>
        
        <DeleteDataDialog onSuccess={handleDeleteSuccess} />
      </div>
    </div>
  )
}