import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 })
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${id}-${Date.now()}.${fileExt}`
    const filePath = `cabin-images/${fileName}`

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('cabin-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      throw uploadError
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('cabin-images')
      .getPublicUrl(filePath)

    // Update cabin with image URL
    const { error: updateError } = await supabase
      .from('cabins')
      .update({ image_url: publicUrl })
      .eq('id', id)

    if (updateError) {
      // If update fails, try to delete the uploaded file
      await supabase.storage.from('cabin-images').remove([filePath])
      throw updateError
    }

    return NextResponse.json({ image_url: publicUrl }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get cabin to find image URL
    const { data: cabin } = await supabase
      .from('cabins')
      .select('image_url')
      .eq('id', id)
      .single()

    if (cabin?.image_url) {
      // Extract file path from URL
      const urlParts = cabin.image_url.split('/cabin-images/')
      if (urlParts.length > 1) {
        const filePath = `cabin-images/${urlParts[1]}`
        await supabase.storage.from('cabin-images').remove([filePath])
      }
    }

    // Remove image URL from cabin
    const { error } = await supabase
      .from('cabins')
      .update({ image_url: null })
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
