import { useState, useRef, useEffect } from 'react'
import './MoodBoard.css'
// 📚 LEARNING: Import libraries for export functionality
// html2canvas - converts HTML elements to images
// jsPDF - creates PDF documents
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

function MoodBoard() {
  // 📚 LEARNING: State for managing images on the moodboard
  // Each image will have: src (image data), x/y position, width/height, and unique id
  const [images, setImages] = useState([])
  
  // 📚 LEARNING: Refs for tracking drag state
  const [draggedImage, setDraggedImage] = useState(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  
  // 📚 LEARNING: Track which image is currently selected for keyboard deletion
  const [selectedImage, setSelectedImage] = useState(null)
  
  // 📚 LEARNING: State for export dropdown visibility
  const [showExportDropdown, setShowExportDropdown] = useState(false)
  
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

  // 📚 LEARNING: Export moodboard as JPEG
  const handleExportJPEG = async () => {
    try {
      // Show user that export is happening
      console.log('Starting JPEG export...')
      
      // Get the moodboard canvas element
      const canvas = boardRef.current
      if (!canvas) {
        alert('Unable to export: moodboard not found')
        return
      }

      // Check if there are any images to export
      if (images.length === 0) {
        alert('Please add some images to your moodboard before exporting!')
        return
      }

      // 📚 LEARNING: Prepare canvas for clean export
      // Find and temporarily hide the export dropdown
      const exportDropdown = canvas.querySelector('.export-dropdown-container')
      const originalDisplay = exportDropdown ? exportDropdown.style.display : null
      if (exportDropdown) {
        exportDropdown.style.display = 'none'
      }

      // Add exporting class to clean up hover effects and buttons
      canvas.classList.add('exporting')

      // Also close any open dropdown to be safe
      setShowExportDropdown(false)

      // Small delay to ensure UI updates before capture
      await new Promise(resolve => setTimeout(resolve, 150))

      // Use html2canvas to capture the moodboard as an image
      // This "takes a screenshot" of the HTML element
      const screenshot = await html2canvas(canvas, {
        backgroundColor: '#1a1a1a', // Match your dark theme
        scale: 2, // Higher quality (2x resolution)
        useCORS: true, // Allow cross-origin images
        allowTaint: true,
        // 📚 LEARNING: Ensure image quality and prevent greying
        foreignObjectRendering: false, // Better image rendering
        imageTimeout: 15000, // More time for image loading
        removeContainer: false,
        // 📚 LEARNING: Ignore elements with specific classes
        ignoreElements: (element) => {
          return element.classList.contains('export-dropdown-container') ||
                 element.classList.contains('export-toggle-btn') ||
                 element.classList.contains('export-dropdown')
        }
      })

      // 📚 LEARNING: Restore export controls visibility and remove exporting class
      canvas.classList.remove('exporting')
      if (exportDropdown && originalDisplay !== null) {
        exportDropdown.style.display = originalDisplay
      } else if (exportDropdown) {
        exportDropdown.style.display = ''
      }

      // Convert the canvas to a data URL (base64 image)
      const imageData = screenshot.toDataURL('image/jpeg', 0.9) // 90% quality

      // Create a download link and trigger it
      const downloadLink = document.createElement('a')
      downloadLink.href = imageData
      downloadLink.download = `moodboard-${new Date().toISOString().slice(0, 10)}.jpg`
      document.body.appendChild(downloadLink)
      downloadLink.click()
      document.body.removeChild(downloadLink)

      console.log('JPEG export completed!')
    } catch (error) {
      console.error('Error exporting JPEG:', error)
      alert('Failed to export JPEG. Please try again.')
    }
  }

  // 📚 LEARNING: Export moodboard as PDF
  const handleExportPDF = async () => {
    try {
      // Show user that export is happening
      console.log('Starting PDF export...')
      
      // Get the moodboard canvas element
      const canvas = boardRef.current
      if (!canvas) {
        alert('Unable to export: moodboard not found')
        return
      }

      // Check if there are any images to export
      if (images.length === 0) {
        alert('Please add some images to your moodboard before exporting!')
        return
      }

      // 📚 LEARNING: Prepare canvas for clean export (same as JPEG)
      const exportDropdown = canvas.querySelector('.export-dropdown-container')
      const originalDisplay = exportDropdown ? exportDropdown.style.display : null
      if (exportDropdown) {
        exportDropdown.style.display = 'none'
      }

      // Add exporting class to clean up hover effects and buttons
      canvas.classList.add('exporting')

      // Also close any open dropdown to be safe
      setShowExportDropdown(false)

      // Small delay to ensure UI updates before capture
      await new Promise(resolve => setTimeout(resolve, 150))

      // First, capture the moodboard as an image (same as JPEG export)
      const screenshot = await html2canvas(canvas, {
        backgroundColor: '#1a1a1a',
        scale: 2,
        useCORS: true,
        allowTaint: true,
        // 📚 LEARNING: Ensure image quality and prevent greying
        foreignObjectRendering: false, // Better image rendering
        imageTimeout: 15000, // More time for image loading
        removeContainer: false,
        // 📚 LEARNING: Ignore export control elements
        ignoreElements: (element) => {
          return element.classList.contains('export-dropdown-container') ||
                 element.classList.contains('export-toggle-btn') ||
                 element.classList.contains('export-dropdown')
        }
      })

      // 📚 LEARNING: Restore export controls visibility and remove exporting class
      canvas.classList.remove('exporting')
      if (exportDropdown && originalDisplay !== null) {
        exportDropdown.style.display = originalDisplay
      } else if (exportDropdown) {
        exportDropdown.style.display = ''
      }

      // Get the dimensions of the captured image
      const imgWidth = screenshot.width
      const imgHeight = screenshot.height

      // Create a new PDF document
      // We'll use landscape orientation if the moodboard is wider than it is tall
      const isLandscape = imgWidth > imgHeight
      const pdf = new jsPDF({
        orientation: isLandscape ? 'landscape' : 'portrait',
        unit: 'px',
        format: [imgWidth, imgHeight]
      })

      // Convert the screenshot to a format jsPDF can use
      const imageData = screenshot.toDataURL('image/jpeg', 0.9)

      // Add the image to the PDF (fill the entire page)
      pdf.addImage(imageData, 'JPEG', 0, 0, imgWidth, imgHeight)

      // Download the PDF
      pdf.save(`moodboard-${new Date().toISOString().slice(0, 10)}.pdf`)

      console.log('PDF export completed!')
    } catch (error) {
      console.error('Error exporting PDF:', error)
      alert('Failed to export PDF. Please try again.')
    }
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
            setShowExportDropdown(false) // Close export dropdown when clicking canvas
          }
        }}
      >
        
        {/* 📚 LEARNING: Export Dropdown - Top-right positioned, only show when there are images */}
        {images.length > 0 && (
          <div className="export-dropdown-container">
            <button 
              className="export-toggle-btn"
              onClick={(e) => {
                e.stopPropagation() // Prevent canvas click from closing
                setShowExportDropdown(!showExportDropdown)
              }}
              title="Export your moodboard"
            >
              Export ⬇
            </button>
            
            {showExportDropdown && (
              <div className="export-dropdown">
                <button 
                  className="export-option export-jpeg-option" 
                  onClick={(e) => {
                    e.stopPropagation()
                    handleExportJPEG()
                    setShowExportDropdown(false)
                  }}
                >
                  📷 JPEG
                </button>
                <button 
                  className="export-option export-pdf-option" 
                  onClick={(e) => {
                    e.stopPropagation()
                    handleExportPDF()
                    setShowExportDropdown(false)
                  }}
                >
                  📄 PDF
                </button>
              </div>
            )}
          </div>
        )}
        
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
