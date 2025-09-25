"""Obtains the same dev count by using advanced search with author and email"""
import os
import json
import argparse
from chrome_stats import chrome_stats_requests

SameDevCache = {}
CHROME_STATS = None


def get_same_devs(name: str, email: str):
    """
    Get the amount of extensions published by a developer using the developer name and email.
    """
    if (name, email) in SameDevCache:
        return SameDevCache[(name, email)]
    payload = {
        "index": "extension",
        "sorting": "userCount",
        "sortDirection": "desc",
        "page": 1,
        "fields": [
            {
                "column": "author",
                "operator": "=",
                "value": name
            },
            {
                "column": "email",
                "operator": "=",
                "value": email
            },
        ]
    }
    response = CHROME_STATS.request(
        f"{chrome_stats_requests.API_URL}/advanced-search", "POST", payload=payload)
    if response.status_code == 200:
        body = response.json()
        same_dev_count = body['total']
        if same_dev_count > 1:
            SameDevCache[(name, email)] = same_dev_count
        if same_dev_count > 0:
            return same_dev_count
    return 1


def main(details_path: str, output: str):
    """Gets the same dev count for every extension in the details path \
        and creates a json file with the results"""
    extensions = os.listdir(details_path)
    same_dev_dict = {}
    for extension in extensions:
        with open(f"{details_path}/{extension}/details.json", "r", encoding="utf-8") as f:
            details = json.load(f)
        same_dev_count = 1
        if 'author' in details and 'email' in details:
            same_dev_count = get_same_devs(details['author'], details['email'])

        same_dev_dict[extension] = same_dev_count

    with open(output, "w", encoding="utf-8") as f:
        json.dump(same_dev_dict, f)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        prog='get_same_dev_count',
        description='Obtains the same dev count by using advanced search with author and email.',
        epilog='')
    parser.add_argument(
        "details_path", help="path to the folder containing the details files")
    parser.add_argument("output", help="path to the output file")
    parser.add_argument(
        "apicalls", help="path to the file containing the apicalls")
    args = parser.parse_args()

    CHROME_STATS = chrome_stats_requests.ChromeStatsRequests(args.apicalls)

    main(args.details_path, args.output)
