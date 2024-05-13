import threading


class RequestMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Store the request in the thread-local context
        threading.current_thread().request = request
        response = self.get_response(request)
        return response
