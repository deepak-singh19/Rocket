import React, { useState, useRef, useEffect, KeyboardEvent } from 'react'
import { User } from '../types'

interface Mention {
  userId: string
  userName: string
  userEmail: string
}

interface MentionInputProps {
  value: string
  onChange: (value: string, mentions: Mention[]) => void
  onSubmit?: () => void
  placeholder?: string
  disabled?: boolean
  maxLength?: number
  users: User[]
  className?: string
  autoFocus?: boolean
}

interface MentionSuggestion extends User {
  startIndex: number
  query: string
}

const MentionInput: React.FC<MentionInputProps> = ({
  value,
  onChange,
  onSubmit,
  placeholder = 'Add a comment... Use @ to mention someone',
  disabled = false,
  maxLength = 2000,
  users = [],
  className = '',
  autoFocus = false
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState<User[]>([])
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0)
  const [mentionQuery, setMentionQuery] = useState<MentionSuggestion | null>(null)
  const [mentions, setMentions] = useState<Mention[]>([])
  
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Extract mentions from current text
  const extractMentions = (text: string): Mention[] => {
    const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g
    const extractedMentions: Mention[] = []
    let match

    while ((match = mentionRegex.exec(text)) !== null) {
      const [, userName, userId] = match
      const user = users.find(u => u.id === userId)
      if (user) {
        extractedMentions.push({
          userId: user.id,
          userName: user.name,
          userEmail: user.email
        })
      }
    }

    return extractedMentions
  }

  // Handle text changes and detect @ mentions
  const handleTextChange = (newValue: string) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const cursorPosition = textarea.selectionStart
    const textBeforeCursor = newValue.substring(0, cursorPosition)
    
    // Check for @ mention at cursor position
    const atIndex = textBeforeCursor.lastIndexOf('@')
    
    if (atIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(atIndex + 1)
      
      // Only show suggestions if @ is at start or preceded by space/newline
      const charBeforeAt = atIndex > 0 ? textBeforeCursor[atIndex - 1] : ' '
      const isValidMentionStart = /\s/.test(charBeforeAt) || atIndex === 0
      
      // Only show if we don't have a space after @ (incomplete mention)
      if (isValidMentionStart && !textAfterAt.includes(' ') && !textAfterAt.includes('\n')) {
        const query = textAfterAt.toLowerCase()
        const filteredUsers = users.filter(user => 
          user.name.toLowerCase().includes(query) || 
          user.email.toLowerCase().includes(query)
        ).slice(0, 5)
        
        setSuggestions(filteredUsers)
        setMentionQuery({
          id: '',
          name: '',
          email: '',
          startIndex: atIndex,
          query: textAfterAt
        })
        setShowSuggestions(filteredUsers.length > 0)
        setSelectedSuggestionIndex(0)
      } else {
        setShowSuggestions(false)
        setMentionQuery(null)
      }
    } else {
      setShowSuggestions(false)
      setMentionQuery(null)
    }

    // Extract and update mentions
    const newMentions = extractMentions(newValue)
    setMentions(newMentions)
    
    // Auto-resize textarea
    textarea.style.height = 'auto'
    textarea.style.height = `${textarea.scrollHeight}px`
    
    onChange(newValue, newMentions)
  }

  // Insert mention into text
  const insertMention = (user: User) => {
    if (!mentionQuery || !textareaRef.current) return

    const textarea = textareaRef.current
    const beforeMention = value.substring(0, mentionQuery.startIndex)
    const afterMention = value.substring(mentionQuery.startIndex + mentionQuery.query.length + 1) // +1 for @
    
    const mentionText = `@[${user.name}](${user.id})`
    const newValue = beforeMention + mentionText + afterMention
    
    // Set cursor position after mention
    const newCursorPosition = beforeMention.length + mentionText.length
    
    handleTextChange(newValue)
    
    // Close suggestions
    setShowSuggestions(false)
    setMentionQuery(null)
    
    // Focus and set cursor position
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(newCursorPosition, newCursorPosition)
    }, 0)
  }

  // Handle keyboard navigation in suggestions
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (showSuggestions && suggestions.length > 0) {
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault()
          setSelectedSuggestionIndex(prev => 
            prev > 0 ? prev - 1 : suggestions.length - 1
          )
          break
        case 'ArrowDown':
          e.preventDefault()
          setSelectedSuggestionIndex(prev => 
            prev < suggestions.length - 1 ? prev + 1 : 0
          )
          break
        case 'Enter':
          e.preventDefault()
          if (suggestions[selectedSuggestionIndex]) {
            insertMention(suggestions[selectedSuggestionIndex])
          }
          break
        case 'Escape':
          e.preventDefault()
          setShowSuggestions(false)
          setMentionQuery(null)
          break
        case 'Tab':
          e.preventDefault()
          if (suggestions[selectedSuggestionIndex]) {
            insertMention(suggestions[selectedSuggestionIndex])
          }
          break
      }
    } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      // Cmd/Ctrl + Enter to submit
      e.preventDefault()
      onSubmit?.()
    }
  }

  // Display text with highlighted mentions
  const renderDisplayText = () => {
    let displayText = value
    const mentionRegex = /@\[([^\]]+)\]\([^)]+\)/g
    
    return displayText.replace(mentionRegex, '@$1')
  }

  // Get cursor position for suggestions placement
  const getSuggestionPosition = () => {
    if (!textareaRef.current || !mentionQuery) return { top: 0, left: 0 }
    
    const textarea = textareaRef.current
    const textBeforeCursor = value.substring(0, mentionQuery.startIndex + mentionQuery.query.length + 1)
    
    // Create a temporary element to measure text position
    const temp = document.createElement('div')
    temp.style.visibility = 'hidden'
    temp.style.position = 'absolute'
    temp.style.whiteSpace = 'pre-wrap'
    temp.style.wordWrap = 'break-word'
    temp.style.font = window.getComputedStyle(textarea).font
    temp.style.width = textarea.offsetWidth + 'px'
    temp.style.padding = window.getComputedStyle(textarea).padding
    temp.textContent = textBeforeCursor
    
    document.body.appendChild(temp)
    const rect = textarea.getBoundingClientRect()
    const tempRect = temp.getBoundingClientRect()
    document.body.removeChild(temp)
    
    return {
      top: rect.top + tempRect.height - textarea.scrollTop + 5,
      left: rect.left + (tempRect.width % textarea.offsetWidth)
    }
  }

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [autoFocus])

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => handleTextChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={maxLength}
        className={`w-full min-h-[80px] p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''} ${className}`}
        style={{ 
          fontFamily: 'inherit',
          lineHeight: '1.4'
        }}
      />
      
      {/* Character count */}
      <div className="absolute bottom-2 right-2 text-xs text-gray-500 pointer-events-none">
        {value.length}/{maxLength}
      </div>

      {/* Mention suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto"
          style={getSuggestionPosition()}
        >
          {suggestions.map((user, index) => (
            <div
              key={user.id}
              className={`px-3 py-2 cursor-pointer flex items-center space-x-2 ${
                index === selectedSuggestionIndex 
                  ? 'bg-blue-50 text-blue-900' 
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => insertMention(user)}
            >
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {user.name}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {user.email}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default MentionInput
