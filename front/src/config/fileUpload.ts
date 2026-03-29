// 文件上传配置
// 后端权威源：picoclaw/web/backend/api/octo/config.go
// 前端仅作 UI 提示，后端校验是安全边界

export const FILE_UPLOAD_CONFIG = {
  maxFileSize: 10 * 1024 * 1024,
  allowedExtensions: [
    // Documents
    '.pdf', '.doc', '.docx', '.txt', '.md',
    // Images
    '.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg', '.ico',
    // Video
    '.mp4', '.webm', '.mov', '.avi',
  ],
}

export function getAllowedExtensionsString(): string {
  return FILE_UPLOAD_CONFIG.allowedExtensions.join(',')
}

export function isAllowedExtension(filename: string): boolean {
  const ext = '.' + filename.split('.').pop()?.toLowerCase()
  return FILE_UPLOAD_CONFIG.allowedExtensions.includes(ext)
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}
