"""Downloads extension crx files and metadata from the Chrome Web Store or Chrome-Stats. 
 To download extensions from Chrome-Stats an API-Key must be entered
 in chrome_stats/chrome_stats_requests.py"""
import os.path
import json
import math
import time
import logging
from urllib.parse import urlparse
from urllib.parse import urlencode
from xml.etree import ElementTree
import argparse
import requests
from chrome_stats import chrome_stats_requests

parser = argparse.ArgumentParser(
    prog='extension_downloader',
    description='Downloads extensions.',
    epilog='')

parser.add_argument("output", help="path to the output folder")
parser.add_argument("error", help="path to the error-log file")
parser.add_argument("apicalls", help="path to the json apicalls file.")
parser.add_argument("--chrome_stats", "-c",
                    help="Only download from chrome-stats", action="store_true")
parser.add_argument("--filter", "-f",
                    help="Path to the json file, containing filter arguments \
                        to download specific extensions. \
                      Used for the advanced search on Chrome-Stats. \
                        The json file should be structured as explained here: \
                            https://docs.chrome-stats.com/api/api-reference#run" +
                    "-an-advanced-search-query-for-extensions-or-reviews", type=str)
parser.add_argument("--id",
                    help="Downloads a specific extensions with that ID.", type=str)
args = parser.parse_args()

CHROME_STATS = chrome_stats_requests.ChromeStatsRequests(args.apicalls)


def chrome_stats_download(extension_id, version):
    """
    Downloads an extension from chrome-stats.com.

    Args:
        extension_id (str): Id of the extension that should be downloaded.
        version (str): The version that should be downloaded.

    Returns:
        bytes or None: The content of the Http-Response in case of success.
                         Returns None if the download failed.
    """
    url = f"{chrome_stats_requests.API_URL}/download?id={extension_id}&type=ZIP" + \
        f"&version={version}"
    r = CHROME_STATS.request(url, timeout=60)
    if r.status_code != 200:
        logging.error(
            "Extension Error: ID: %s ZIP Chrome-Stats download failed. Status Code: %s.\
                          Trying to obtain CRX version...",
            extension_id, r.status_code)
        url = f"{chrome_stats_requests.API_URL}/download?id={extension_id}&type=CRX" + \
            f"&version={version}"
        r = CHROME_STATS.request(url, timeout=60)
        if r.status_code != 200:
            logging.error(
                "Extension Error: ID: %s CRX Chrome-Stats download failed as well. Status Code: %s",
                extension_id, r.status_code)
            return None

    return r.content


def get_details(extension_id):
    """
    Gets the details of an extensions from chrome-stats.com.

    Args:
        extension_id (int): Id of the extension of which the details should be downloaded.

    Returns:
        Any: Json-encoded content of a successfull Http-Response. Returns None if an error occured.
    """
    response = CHROME_STATS.request(
        f"{chrome_stats_requests.API_URL}/detail?id={extension_id}")
    if response.status_code != 200:
        logging.error(
            "Extension Error: ID: %s Details download failed. Status Code: %s",
            extension_id, response.status_code)
        return None
    try:
        details = response.json()
    except ValueError:
        logging.error(
            "Extension Error: ID: %s JSON ERROR. 'Details'",
            extension_id)
        return None
    return details


def download(extension_id):
    """
    Downloads crx file and details of an extension.

    Args:
        extension_id (str): Id of the extension.
    """
    if os.path.exists(f'{args.output}/{extension_id}'):
        return

    details = get_details(extension_id)
    if details is None:
        return

    crx_base_url = 'https://clients2.google.com/service/update2/crx'
    crx_params = urlencode({
        'response': 'redirect',
        'prodversion': '91.0',
        'acceptformat': 'crx2,crx3',
        'x': 'id=' + extension_id + '&uc'
    })
    crx_url = crx_base_url + '?' + crx_params
    crx_path = f'{args.output}/{extension_id}/{extension_id}.crx'

    try:
        r = None
        content = None
        if not args.chrome_stats:
            r = requests.get(crx_url, timeout=60, allow_redirects=True)
        if args.chrome_stats or r.status_code != 200:
            status_code = None
            if r is not None:
                status_code = r.status_code
                logging.error(
                    "Extension Error: ID: %s Download failed. Status Code: %s",
                    extension_id, status_code)
            if 'version' not in details:
                logging.error(
                    "Extension Error: ID: %s MISSING VERSION", extension_id)
                return
            content = chrome_stats_download(
                extension_id, details['version'])
            if content is None:
                return
        else:
            content = r.content
        logging.info('Downloading %s to %s ...', extension_id, crx_path)
        os.makedirs(f'{args.output}/{extension_id}')
        with open(crx_path, 'wb') as file:
            file.write(content)
        with open(f'{args.output}/{extension_id}/details.json', "w",
                  encoding="utf-8") as details_file:
            details_file.write(json.dumps(details, indent=2))
    except Exception as error:
        logging.error(
            "Extension Error: ID: %s UNEXTPECTED ERROR. %s-%s",
            extension_id, type(error).__name__, error)
        return


def download_sitemap(url):
    """
    Downloads every extension present on the sitemap page.

    Args:
        url (str): Url of the sitemap page of the Chrome Web Store.
    """
    time.sleep(5)
    r = requests.get(url, timeout=60)

    if r.status_code != 200:
        logging.error(
            "General Error: Not able to load sitemap. %s: %s", r.status_code, url)
        return

    try:
        root = ElementTree.fromstring(r.content)
    except ElementTree.ParseError as error:
        logging.error("General Error: XML error parsing the sitemap. %s-%s",
                      type(error).__name__, error)
        return

    for child in root:
        extension_url = urlparse(child[0].text)
        extension_id = os.path.basename(extension_url.path)
        download(extension_id)


def advanced_search():
    """
    Uses chrome-stats.com advanced search to get extension ids.
    """
    payload = {
        "index": "extension",
        "sorting": "userCount",
        "sortDirection": "desc",
    }
    with open(args.filter, "r", encoding="utf-8") as file:
        payload['fields'] = json.load(file)
    pages = 0
    i = 0
    try:
        with open("downloader/page.txt", "r", encoding="utf-8") as site_file:
            i = int(site_file.read())
            pages = i
    except OSError as error:
        logging.error("General Error: Error opening file: 'page.txt'. %s-%s.\
                      Ignore this error if you are running the download for the first time.",
                      type(error).__name__, error)
    ids = []
    while i <= pages:
        payload['page'] = i
        i += 1
        r = CHROME_STATS.request(f"{chrome_stats_requests.API_URL}/advanced-search",
                                 payload=payload, timeout=30, http_type="POST")
        try:
            body = r.json()
        except ValueError:
            logging.error(
                'General Error: Advanced Search response could not be \
                parsed as json. %s\n %s', r.status_code, r.content)
            return
        if not "items" in body:
            logging.error(
                'General Error: Advanced Search does not contain keyword "item".')
            return

        if "total" in body:
            pages = math.ceil(body['total']/25)
        for item in body['items']:
            if not "id" in item:
                logging.error(
                    'General Error: An item in advanced search did not contain keyword "id".')
                continue
            download(item["id"])
            ids.append(item["id"])
        with open("downloader/page.txt", "w", encoding="utf-8") as site_file:
            site_file.write(str(i))


def start_download():
    """
    Starts the download process of downloading every extension from
    the Chrome Web Store using the sitemap.
    """

    logging.basicConfig(
        level=logging.ERROR,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(args.error),
            logging.StreamHandler()
        ]
    )

    if not os.path.exists(args.output):
        os.makedirs(args.output)

    if not os.path.exists(args.error):
        os.makedirs(args.error)

    if args.id:
        download(args.id)
        return

    if args.filter:
        advanced_search()
        return

    url = "https://chrome.google.com/webstore/sitemap"
    r = requests.get(url, timeout=30)

    if r.status_code != 200:
        logging.error(
            "General Error: Not able to load sitemap. %s: %s", r.status_code, url)
        return

    try:
        root = ElementTree.fromstring(r.content)
    except ElementTree.ParseError as error:
        logging.error("General Error: XML error parsing the sitemap. %s-%s",
                      type(error).__name__, error)
        return

    site = 0
    try:
        with open("downloader/site.txt", "r", encoding="utf-8") as site_file:
            site = site_file.read()
    except OSError as error:
        logging.error("General Error: Error opening file: 'site.txt'. %s-%s.\
                      Ignore this error if you are running the download for the first time.",
                      type(error).__name__, error)

    for child in root:
        site_url = child[0].text
        download_sitemap(site_url)
        site = site_url
        with open("downloader/site.txt", "w", encoding="utf-8") as site_file:
            site_file.write(str(site))


if __name__ == '__main__':
    start_download()
