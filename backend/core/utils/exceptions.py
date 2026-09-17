from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
import logging

logger = logging.getLogger(__name__)

def custom_exception_handler(exc, context):
    """
    Custom exception handler to return consistent error shapes across the API.
    Shape:
    {
        "success": false,
        "message": "Error description",
        "errors": { ... } // validation details if applicable
    }
    """
    # Call REST framework's default exception handler first,
    # to get the standard error response.
    response = exception_handler(exc, context)

    if response is not None:
        custom_data = {
            'success': False,
            'message': 'Validation Error' if response.status_code == status.HTTP_400_BAD_REQUEST else 'An error occurred',
            'errors': response.data
        }

        # If it's a detail message, promote it to message
        if isinstance(response.data, dict) and 'detail' in response.data:
            custom_data['message'] = response.data['detail']
            custom_data['errors'] = {}
            
        elif isinstance(response.data, list) and len(response.data) > 0 and isinstance(response.data[0], str):
             custom_data['message'] = response.data[0]
             custom_data['errors'] = {}

        response.data = custom_data
    else:
        # Fallback for non-DRF exceptions (500s)
        logger.exception("Unhandled Server Error")
        response = Response({
            'success': False,
            'message': 'An unexpected server error occurred.',
            'errors': {}
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return response
