import { useState, useRef, useEffect } from 'react'
import './MoodBoard.css'

function MoodBoard() {
  // 📚 LEARNING: State for managing images on the moodboard
  // Each image will have: src (image data), x/y position, width/height, and unique id
  const [images, setImages] = useState([])
  
  // 📚 LEARNING: Refs for tracking drag state
  const [draggedImage, setDraggedImage] = useState(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  
  // 📚 LEARNING: Track which image is currently selected for keyboard deletion
  const [selectedImage, setSelectedImage] = useState(null)
  
  const boardRef = useRef(null)

  // 📚 LEARNING: Keyboard event listener for deleting selected images
  useEffect(() => {
    const handleKeyDown = (e) => {
      // If backspace is pressed and we have a selected image, delete it
      if (e.key === 'Backspace' && selectedImage) {
        e.preventDefault() // Prevent browser back navigation
        handleDeleteImage(selectedImage)
        setSelectedImage(null) // Clear selection after deletion
      }
      // Clear selection on Escape key
      if (e.key === 'Escape') {
        setSelectedImage(null)
      }
    }

    // Add event listener to document
    document.addEventListener('keydown', handleKeyDown)
    
    // Cleanup function to remove event listener
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [selectedImage]) // Re-run effect when selectedImage changes

  // 📚 LEARNING: Handle drag over event (required for drop to work)
  const handleDragOver = (e) => {
    e.preventDefault() // Prevent default behavior to allow drop
  }

  // 📚 LEARNING: Handle file drop
  const handleDrop = (e) => {
    e.preventDefault()
    
    // Get the files that were dropped
    const files = Array.from(e.dataTransfer.files)
    
    // Filter only image files
    const imageFiles = files.filter(file => file.type.startsWith('image/'))
    
    // Process each image file
    imageFiles.forEach((file) => {
      const reader = new FileReader()
      
      // When file is read, add it to our moodboard
      reader.onload = (event) => {
        // Get drop position relative to the board
        const boardRect = boardRef.current.getBoundingClientRect()
        const x = e.clientX - boardRect.left - 100 // Center the image on cursor
        const y = e.clientY - boardRect.top - 100
        
        // Create new image object
        const newImage = {
          id: Date.now() + Math.random(), // Unique ID
          src: event.target.result, // Base64 image data
          x: Math.max(0, x), // Ensure it's within bounds
          y: Math.max(0, y),
          width: 200, // Default size
          height: 200,
        }
        
        // Add to images array
        setImages(prev => [...prev, newImage])
      }
      
      // Read file as data URL (base64)
      reader.readAsDataURL(file)
    })
  }

  // 📚 LEARNING: Handle image selection and start dragging
  const handleImageMouseDown = (e, imageId) => {
    e.preventDefault()
    
    // Select the image for keyboard operations
    setSelectedImage(imageId)
    
    // Find the image being dragged
    const image = images.find(img => img.id === imageId)
    if (!image) return
    
    // Calculate offset from mouse to image corner
    const imageElement = e.currentTarget
    const rect = imageElement.getBoundingClientRect()
    const boardRect = boardRef.current.getBoundingClientRect()
    
    setDraggedImage(imageId)
    setDragOffset({
      x: e.clientX - boardRect.left - image.x,
      y: e.clientY - boardRect.top - image.y
    })
  }

  // 📚 LEARNING: Handle mouse move while dragging
  const handleMouseMove = (e) => {
    if (!draggedImage) return
    
    // Calculate new position
    const boardRect = boardRef.current.getBoundingClientRect()
    const newX = e.clientX - boardRect.left - dragOffset.x
    const newY = e.clientY - boardRect.top - dragOffset.y
    
    // Update the dragged image position
    setImages(prev => prev.map(img => 
      img.id === draggedImage 
        ? { 
            ...img, 
            x: Math.max(0, Math.min(newX, boardRect.width - img.width)), 
            y: Math.max(0, Math.min(newY, boardRect.height - img.height))
          }
        : img
    ))
  }

  // 📚 LEARNING: Stop dragging
  const handleMouseUp = () => {
    setDraggedImage(null)
    setDragOffset({ x: 0, y: 0 })
  }

  // 📚 LEARNING: Delete an image
  const handleDeleteImage = (imageId) => {
    setImages(prev => prev.filter(img => img.id !== imageId))
  }

  // 📚 LEARNING: Clear all images
  const handleClearBoard = () => {
    setImages([])
  }

  return (
    <div className="moodboard-container">
      {/* Main Moodboard Canvas */}
      <div 
        ref={boardRef}
        className={`moodboard-canvas ${images.length === 0 ? 'empty' : ''}`}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp} // Stop dragging if mouse leaves board
        onClick={(e) => {
          // If clicking on empty canvas (not on an image), deselect any selected image
          if (e.target === e.currentTarget) {
            setSelectedImage(null)
          }
        }}
      >
        
        {/* Minimal empty state */}
        {images.length === 0 && (
          <div className="moodboard-empty">
            <h3>Drop Images Here</h3>
          </div>
        )}

        {/* Render all images */}
        {images.map((image) => (
          <div
            key={image.id}
            className={`moodboard-image ${draggedImage === image.id ? 'dragging' : ''} ${selectedImage === image.id ? 'selected' : ''}`}
            style={{
              left: image.x,
              top: image.y,
              width: image.width,
              height: image.height,
            }}
            onMouseDown={(e) => handleImageMouseDown(e, image.id)}
          >
            {/* Delete button */}
            <button 
              className="delete-image-btn"
              onClick={() => handleDeleteImage(image.id)}
              title="Remove image"
            >
              ❌
            </button>
            
            {/* The actual image */}
            <img 
              src={image.src} 
              alt="Moodboard item"
              draggable={false} // Prevent native drag
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export default MoodBoard
