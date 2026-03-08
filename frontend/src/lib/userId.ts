// Generate a unique ID for the user
export function generateUserId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Get or create user ID for a session
export function getUserId(sessionId: string): string | null {
  return localStorage.getItem(`session_${sessionId}_userId`);
}

export function setUserId(sessionId: string, userId: string): void {
  localStorage.setItem(`session_${sessionId}_userId`, userId);
}

export function getUserName(sessionId: string): string | null {
  return localStorage.getItem(`session_${sessionId}_name`);
}

export function setUserName(sessionId: string, name: string): void {
  localStorage.setItem(`session_${sessionId}_name`, name);
}

export function getAuthorId(sessionId: string): string | null {
  return localStorage.getItem(`session_${sessionId}_authorId`);
}

export function setAuthorId(sessionId: string, authorId: string): void {
  localStorage.setItem(`session_${sessionId}_authorId`, authorId);
}

export function isSessionAuthor(sessionId: string, authorId: string): boolean {
  const savedAuthorId = getAuthorId(sessionId);
  return savedAuthorId === authorId;
}

export function clearUserSession(sessionId: string): void {
  localStorage.removeItem(`session_${sessionId}_userId`);
  localStorage.removeItem(`session_${sessionId}_name`);
  localStorage.removeItem(`session_${sessionId}_authorId`);
}
