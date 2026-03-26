import axios from 'axios'

const api = axios.create({
  baseURL: '/octo/api',
  timeout: 30000,
})

export interface UploadResponse {
  ref: string
  filename: string
  contentType: string
  size: number
}

export const mediaApi = {
  async uploadFile(file: File): Promise<UploadResponse> {
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await api.post<{ data: UploadResponse; success: boolean }>(
        'media/upload',
        formData
      )
      return response.data.data
    } catch (error: any) {
      console.error('Upload error response:', error.response?.data)
      throw error
    }
  },
}
