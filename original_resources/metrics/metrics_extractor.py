"""Extracts all specific metrics from the extensions."""
import os
import json
import re
import timeit
from multiprocessing import Process
import argparse
import spacy

nlp = spacy.load("en_core_web_lg")

HOST_PERMISSION_PATTERN = r"http(s)?:\/\/.*(\/.*)?|file:\/\/\/.*|<all_urls>|urn:.*|.*:\/\/.*"


def seperate_host_permissions_in_v2(permissions: list, host_permissions: list):
    """Seperates Host Permissions from API Permissions in manifest version 2"""
    i = 0
    while i < len(permissions):
        permission = permissions[i]
        if isinstance(permission, dict):
            permission[i] = list(permission.keys())[0]
            i += 1
            continue
        if re.match(HOST_PERMISSION_PATTERN, permission):
            host_permissions.append(permission)
            permissions.pop(i)
        else:
            i += 1


def parse_permissions(path: str):
    """Parses Permissions, Optional Permissions, Host Permissions, Optional Host Permissions,
      and Content Script matches of a manifest file."""

    with open(path, "r", encoding="utf-8") as manifest:
        data = json.load(manifest)
    permissions = data.get("permissions", [])
    optional_permissions = data.get("optional_permissions", [])
    optional_host_permissions = []
    host_permissions = []
    if data["manifest_version"] == 2:
        seperate_host_permissions_in_v2(permissions, host_permissions)
        seperate_host_permissions_in_v2(
            optional_permissions, optional_host_permissions)
    else:
        host_permissions = data.get("host_permissions", [])
        optional_host_permissions = data.get("optional_host_permissions", [])
    content_scripts = []
    if "content_scripts" in data:
        for content_script in data['content_scripts']:
            if isinstance(content_script, dict) and "matches" in content_script:
                for item in content_script['matches']:
                    content_scripts.append(item)

    return permissions, optional_permissions, \
        host_permissions, optional_host_permissions, content_scripts


def parse_keywords(text: str, keywords=None):
    """Parses the keywords of a text and removes stopper words"""
    try:
        words = nlp(text)
    except ValueError:
        return keywords
    if keywords is None:
        keywords = {}
    filtered_words = [word for word in words if (
        not word.is_stop and not word.is_punct) or word.text.upper() in ["N'T", "NOT"]]
    saved_terms = []
    for word in filtered_words:
        if len(word.text) <= 1 or word.text == "" or word.text == "\n\n":
            continue
        lemma = word.lemma_.upper()
        if lemma in ["NOT"]:
            saved_terms.append(lemma)
            continue
        elif len(saved_terms) > 0:
            if "NOT" in saved_terms:
                lemma = f"{' '.join(saved_terms)} {lemma}"
            saved_terms = []
        if lemma in keywords:
            keywords[lemma] += 1
        else:
            keywords[lemma] = 1
    return keywords


def parse_details(path: str):
    """Extracts the features of the details file."""
    with open(path, "r", encoding="utf-8") as details:
        data = json.load(details)
    details = {}
    details["ratingValue"] = data.get("ratingValue", 0)
    details["ratingCount"] = data.get("ratingCount", 0)
    details["userCount"] = data.get("userCount", 0)
    details["size"] = data["size"]

    details["description"] = parse_keywords(data.get("description", ""))

    details["fullSummary"] = parse_keywords(data.get("fullSummary", ""))

    if "related" in data:
        details['related'] = data['related'][:min(5, len(data['related']))]
    details['lastUpdate'] = data['lastUpdate']
    return details


def parse_reviews(reviews: dict, extension_id: str):
    """Parses the keywords of the reviews."""
    if not extension_id in reviews:
        return {}
    keywords = {}
    for review in reviews[extension_id]:
        parse_keywords(review, keywords)
    return keywords


def get_sizes(path: str, details: dict):
    """Gets the size and numbers of files."""
    with open(path, "r", encoding="utf-8") as count:
        data = json.load(count)
    details["jsSize"] = data["js-size"]
    details["fileCount"] = data["file_count"]
    details["jsFileCount"] = data["js_file_count"]
    details["contentScriptCount"] = data["content_scripts_count"]
    details["backgroundScriptCount"] = data["background_scripts_count"]
    details["warsCount"] = data["wars_count"]
    details["otherJsCount"] = data["other_js_count"]
    return details


def parse_extension(extension_id: str, extension_dir: str, details_path: str,
                    reviews: dict, same_dev_count: dict):
    """Extracts the features of an extension."""
    details = parse_details(os.path.join(
        details_path, f"{extension_id}/details.json"))
    details['permissions'], details['optionalPermissions'], \
        details['hostPermissions'], details['optionalHostPermissions'], \
        details["contentScriptMatches"] = \
        parse_permissions(os.path.join(
            extension_dir, f"{extension_id}/manifest.json"))
    details['reviews'] = parse_reviews(reviews, extension_id)
    details = get_sizes(os.path.join(
        extension_dir, f"{extension_id}/count.json"), details)
    details['id'] = extension_id
    details["sameDevCount"] = same_dev_count[extension_id]
    return details


def parse_extensions(extensions: list, extension_dir: str, details_path: str,
                     index: int, output: str, reviews: dict, same_dev_count: dict):
    """Extracts the features of a list of extensions."""
    start = timeit.default_timer()
    count = 0

    for extension in extensions:
        result = parse_extension(
            extension, extension_dir, details_path, reviews, same_dev_count)
        if result is not None:
            with open(f"{output}/{extension}.json", "w", encoding="utf8") as file:
                file.write(json.dumps(result))
        count += 1
        if count % 500 == 0:
            print(f"{index}: {count}")
    with open(f"{output}/benchmarks/{index}.json", "w", encoding="utf8") as file:
        benchmark = json.dumps(
            {len(extensions): timeit.default_timer() - start})
        file.write(benchmark)


def main():
    """Parses Cmdline Arguments."""

    parser = argparse.ArgumentParser(
        prog='metrics_parser',
        description='Parses the metrics of Browser Extensions.',
        epilog='')
    parser.add_argument(
        "unpacked_path", help="path to the folder of unpacked extensions")
    parser.add_argument(
        "details_path", help="path to the folder containing the details files")
    parser.add_argument("same_dev_count_path",
                        help="path to the file containing the same dev counts")
    parser.add_argument(
        "review_path", help="path to the file containing the reviews")
    parser.add_argument("output", help="path to the output folder")
    parser.add_argument("threadcount", help="Number of threads", type=int)
    args = parser.parse_args()

    if not os.path.exists(args.output):
        os.makedirs(args.output)
    if not os.path.exists(f"{args.output}/benchmarks"):
        os.makedirs(f"{args.output}/benchmarks")

    with open(args.review_path, "r", encoding="utf-8") as f:
        reviews = json.load(f)

    with open(args.same_dev_count_path, "r", encoding="utf-8") as f:
        same_dev_count = json.load(f)

    dir_list = os.listdir(args.unpacked_path)
    size = int(len(dir_list)/args.threadcount)
    threads = [None] * args.threadcount
    for i in range(args.threadcount):
        if i == args.threadcount - 1:
            extension_list = dir_list[i*size:len(dir_list)]
        else:
            extension_list = dir_list[i*size:(i+1)*size]
        threads[i] = Process(target=parse_extensions, args=[
            extension_list, args.unpacked_path, args.details_path, i, args.output,
            reviews, same_dev_count])
        threads[i].start()

    for i in range(args.threadcount):
        threads[i].join()


if __name__ == "__main__":
    main()
