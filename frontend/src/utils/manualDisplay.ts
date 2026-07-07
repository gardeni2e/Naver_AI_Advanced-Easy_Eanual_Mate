export function getDisplayManualName(fileName: string) {
  return fileName.replace(/^[a-f0-9]{12,}[_-](.+)$/i, "$1");
}
