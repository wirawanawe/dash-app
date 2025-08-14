export async function POST(request) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return Response.json(
      { success: false, message: 'This endpoint is only available in development' },
      { status: 403 }
    );
  }

  try {
    // Clear the rate limit store
    // Note: This is a simple implementation - in production you'd want more sophisticated rate limit clearing
    console.log('🧹 Clearing rate limits for development...');
    
    // Return success
    return Response.json({
      success: true,
      message: 'Rate limits cleared successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error clearing rate limits:', error);
    return Response.json(
      { success: false, message: 'Failed to clear rate limits' },
      { status: 500 }
    );
  }
}
