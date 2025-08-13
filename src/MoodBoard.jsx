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
  
  // 📚 LEARNING: State for dynamic background gradient based on image colors
  const [backgroundGradient, setBackgroundGradient] = useState('linear-gradient(145deg, var(--background-card) 0%, rgba(0, 212, 255, 0.02) 50%, var(--background-card) 100%)')
  
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

  // 📚 LEARNING: Extract dominant colors from an image using Canvas API
  const extractImageColors = (imageSrc) => {
    return new Promise((resolve) => {
      console.log('🎨 Extracting colors from image:', imageSrc.substring(0, 50) + '...')
      
      const img = new Image()
      // 📚 LEARNING: Only set crossOrigin for external URLs, not for data URLs
      if (!imageSrc.startsWith('data:')) {
        img.crossOrigin = 'anonymous' // Handle CORS for external images
      }
      
      img.onload = () => {
        console.log('🎨 Image loaded successfully, size:', img.width, 'x', img.height)
        // Create a canvas to analyze the image
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        // Set canvas size (smaller for faster processing)
        const maxSize = 100
        const ratio = Math.min(maxSize / img.width, maxSize / img.height)
        canvas.width = img.width * ratio
        canvas.height = img.height * ratio
        
        // Draw image on canvas
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        
        // Get image data (pixel information)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageData.data
        
        // Count color frequency
        const colorMap = {}
        
        // Sample every 4th pixel for performance (skip some pixels)
        for (let i = 0; i < data.length; i += 16) { // Skip more pixels for speed
          const r = data[i]
          const g = data[i + 1] 
          const b = data[i + 2]
          const alpha = data[i + 3]
          
          // Skip transparent pixels
          if (alpha < 128) continue
          
          // Round colors to reduce noise (group similar colors together)
          const roundedR = Math.round(r / 32) * 32
          const roundedG = Math.round(g / 32) * 32
          const roundedB = Math.round(b / 32) * 32
          
          const colorKey = `${roundedR},${roundedG},${roundedB}`
          colorMap[colorKey] = (colorMap[colorKey] || 0) + 1
        }
        
        // Find the most frequent colors
        const sortedColors = Object.entries(colorMap)
          .sort(([,a], [,b]) => b - a) // Sort by frequency
          .slice(0, 3) // Take top 3 colors
          .map(([color]) => {
            const [r, g, b] = color.split(',').map(Number)
            return `rgb(${r}, ${g}, ${b})`
          })
        
        // If we don't have enough colors, add some defaults
        while (sortedColors.length < 3) {
          sortedColors.push('rgb(128, 128, 128)') // Neutral gray
        }
        
        console.log('🎨 Extracted colors for this image:', sortedColors)
        resolve(sortedColors)
      }
      
      img.onerror = (error) => {
        // If image fails to load, return neutral colors
        console.log('🎨 Error loading image for color extraction:', error)
        console.log('🎨 Image src was:', imageSrc.substring(0, 100) + '...')
        resolve(['rgb(128, 128, 128)', 'rgb(96, 96, 96)', 'rgb(160, 160, 160)'])
      }
      
      img.src = imageSrc
    })
  }

  // 📚 LEARNING: Create a gradient from multiple color arrays
  const generateGradientFromColors = (allColors) => {
    if (allColors.length === 0) {
      // Return default gradient when no images
      return 'linear-gradient(145deg, var(--background-card) 0%, rgba(0, 212, 255, 0.02) 50%, var(--background-card) 100%)'
    }
    
    // Flatten all colors into one array
    const flatColors = allColors.flat()
    
    // Remove duplicates and limit to 6 colors for performance
    const uniqueColors = [...new Set(flatColors)].slice(0, 6)
    
    if (uniqueColors.length === 0) {
      return 'linear-gradient(145deg, var(--background-card) 0%, rgba(0, 212, 255, 0.02) 50%, var(--background-card) 100%)'
    }
    
    // Create gradient with much more intense colors
    const gradientStops = uniqueColors.map((color, index) => {
      const position = (index / (uniqueColors.length - 1)) * 100
      // Extract RGB values and add much higher opacity for dramatic effect
      const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
      if (rgbMatch) {
        const [, r, g, b] = rgbMatch
        // Mix the extracted color with dark gray for better visibility
        const mixedR = Math.round(r * 0.6 + 30 * 0.4) // 60% image color, 40% dark base
        const mixedG = Math.round(g * 0.6 + 30 * 0.4)
        const mixedB = Math.round(b * 0.6 + 30 * 0.4)
        return `rgba(${mixedR}, ${mixedG}, ${mixedB}, 0.4) ${position}%`
      }
      return `${color}60 ${position}%` // Fallback with higher opacity
    }).join(', ')
    
    // Create a much more visible gradient with lighter base
    return `linear-gradient(145deg, 
      rgba(25, 25, 25, 0.8) 0%, 
      ${gradientStops}, 
      rgba(25, 25, 25, 0.8) 100%)`
  }

  // 📚 LEARNING: Update background when images change
  useEffect(() => {
    const updateBackground = async () => {
      console.log('🎨 Updating background, images count:', images.length)
      
      if (images.length === 0) {
        // Reset to default when no images
        console.log('🎨 No images, resetting to default gradient')
        setBackgroundGradient('linear-gradient(145deg, var(--background-card) 0%, rgba(0, 212, 255, 0.02) 50%, var(--background-card) 100%)')
        return
      }
      
      console.log('🎨 Extracting colors from', images.length, 'images')
      
      // Extract colors from all images
      const colorPromises = images.map(image => extractImageColors(image.src))
      const allImageColors = await Promise.all(colorPromises)
      
      console.log('🎨 Extracted colors:', allImageColors)
      
      // Generate new gradient
      const newGradient = generateGradientFromColors(allImageColors)
      console.log('🎨 Generated gradient:', newGradient)
      
      setBackgroundGradient(newGradient)
    }
    
    updateBackground()
  }, [images]) // Run when images array changes

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
        style={{
          background: backgroundGradient,
          transition: 'background 0.8s ease-in-out' // Smooth gradient transitions
        }}
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
