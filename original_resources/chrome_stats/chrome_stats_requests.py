"""Contains chrome-stats.com request wrapper"""
import os
import datetime
import json
import math
import time
import requests

API_URL = "https://chrome-stats.com/api"
API_CALL_LIMIT = 10000
API_KEY = "ENTER_API_KEY"

class ChromeStatsRequests:
    """Used to wrap requests to chrome-stats.com and automatically handle
      the daily api-call limit"""

    CHROME_STATS_HEADERS = {
        "content-type": "application/json",
        "x-api-key": API_KEY,
    }

    api_call_count = 0

    def __init__(self, apicalls_path):
        self.apicalls_path = apicalls_path
        self.get_api_calls()

    def get_api_calls(self):
        """
        Gets the amount of used API calls of the current day.
        """
        call_data = {}
        date = str(datetime.datetime.utcnow().date())
        if os.path.exists(self.apicalls_path):
            with open(self.apicalls_path, "r", encoding="utf-8") as file:
                call_data = json.load(file)
            if date in call_data:
                self.api_call_count = call_data[date]
                return
        call_data[date] = 0
        self.api_call_count = 0
        with open(self.apicalls_path, "w", encoding="utf-8") as file:
            file.write(json.dumps(call_data, indent=2))

    def store_api_calls(self):
        """
        After every 100 API calls the amount of calls are stored.
        """
        if self.api_call_count % 100 == 0 or self.api_call_count == API_CALL_LIMIT:
            date = str(datetime.datetime.utcnow().date())
            call_data = {}
            with open(self.apicalls_path, "r", encoding="utf-8") as file:
                call_data = json.load(file)
            if date not in call_data:
                self.api_call_count = 100
            call_data[date] = self.api_call_count
            with open(self.apicalls_path, "w", encoding="utf-8") as file:
                file.write(json.dumps(call_data, indent=2))

    def request(self, url, http_type="GET", timeout=30, payload=None):
        """
        A wrapper for requests to chrome-stats.com to count the api calls.
        If the API call limit is reached the application sleeps until the next day to continue.

        Args:
            url (str): Specfic url to request.
            http_type (str): HTTP request type. "GET" or "POST" are supported.
            timeout (int):  Time in seconds before timeout.
            payload (Any): Payload for POST requests

        Returns:
            Response or None: Returns the response or None if the http_type is not supported.
        """
        if self.api_call_count >= API_CALL_LIMIT:
            self.get_api_calls()
            if self.api_call_count >= API_CALL_LIMIT:
                now = datetime.datetime.utcnow()
                tomorrow = now + datetime.timedelta(days=1)
                tomorrow = datetime.datetime(
                    tomorrow.year, tomorrow.month, tomorrow.day, 0, 0, 0)
                time_until_tomorrow = (tomorrow-now).total_seconds()
                time_until_tomorrow = math.ceil(time_until_tomorrow)
                print(
                    f"API Call Limit reached! Sleeping for {time_until_tomorrow} seconds...")
                time.sleep(time_until_tomorrow)
                self.get_api_calls()

        self.api_call_count += 1
        self.store_api_calls()
        time.sleep(3)
        if http_type == "GET":
            return requests.get(url, headers=self.CHROME_STATS_HEADERS, timeout=timeout,
                                allow_redirects=True)
        if http_type == "POST":
            return requests.post(url, headers=self.CHROME_STATS_HEADERS, json=payload,
                                 timeout=timeout, allow_redirects=True)
        return None
