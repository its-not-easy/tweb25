"""Extracts the features from the extracted metrics files"""
import os
import json
from multiprocessing import Process, Queue
import argparse
from metrics import metrics as Metrics

Permissions = {}
Benign_List = set()


def keyword_feature_match(keywords, dataset, features, feature_name):
    """Checks for every keyword which keywords a dataset uses"""
    for keyword in keywords:
        features[f"{feature_name} {keyword}"] = keyword in dataset


def extract_features(data: dict, benign_path: str, path):
    """Extracts Features from the metrics and related extensions"""
    feature = {}
    for key, value in data.items():
        if isinstance(value, (float, int)):
            feature[key] = value
            continue
        if isinstance(value, list):
            try:
                value = set(value)
            except TypeError:
                filtered_list = [
                    item for item in value if isinstance(item, str)]
                value = set(filtered_list)
        if key == "permissions":
            keyword_feature_match(Metrics.PERMISSIONS,
                                  value, feature, "Permissions")
        elif key == "hostPermissions":
            keyword_feature_match(Metrics.HOST_PERMISSIONS,
                                  value, feature, "Host-Permissions")
        elif key == "contentScriptMatches":
            keyword_feature_match(Metrics.CONTENT_MATCHES,
                                  value, feature, "Content-Script-Matches")
        elif key == "description":
            keyword_feature_match(Metrics.DESCRIPTION,
                                  value, feature, "Description")
        elif key == "fullSummary":
            keyword_feature_match(Metrics.SUMMARY, value,
                                  feature, "Full-Summary")
        elif key == "reviews":
            keyword_feature_match(Metrics.REVIEWS, value, feature, "Reviews")

    related = []
    if "related" in data:
        related = data["related"]
    try:
        permissions = set(data['permissions'] + data['optionalPermissions'])
    except TypeError:
        try:
            permissions = set([item for item in data['permissions']
                               if isinstance(item, str)]
                              + [item for item in data['optionalPermissions']
                                 if isinstance(item, str)])
        except Exception:
            try:
                print(data['id'])
            except KeyError:
                print(path)
                print("\n")
    for related_id in related:
        if not related_id in Permissions and related_id in Benign_List:
            with open(os.path.join(benign_path, related_id + ".json"), "r", encoding="utf-8") as f:
                related_data = json.load(f)
                try:
                    Permissions[related_id] = set(related_data['permissions'] +
                                                  related_data["optionalPermissions"])
                except TypeError:
                    Permissions[related_id] = set([item for item in related_data['permissions']
                                                   if isinstance(item, str)]
                                                  + [item for item in
                                                     related_data['optionalPermissions']
                                                     if isinstance(item, str)])

    for permission in Metrics.PERMISSIONS:
        score = 0
        if permission in permissions:
            for related_id in related:
                if related_id in Benign_List:
                    if not permission in Permissions[related_id]:
                        score -= 1
        feature[f"Related-Permission {permission}"] = score
    return feature


def read_features(extensions: list, path: str, benign_path: str, keywords_path:str, queue: Queue):
    """Reads all files."""
    Metrics.init(keywords_path)
    features = {}
    count = 0
    for extension in extensions:
        feature_path = os.path.join(path, extension)
        if os.path.isdir(feature_path):
            continue
        with open(feature_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            features[extension.replace(".json", "")] = \
                extract_features(data, benign_path, feature_path)
        if count % 500 == 0:
            print(count)
        count += 1
    queue.put(features)


def main():
    """Parses cmd line arguments."""
    parser = argparse.ArgumentParser(
        prog='feature_extractor',
        description='Extracts the features from the extracted metrics files.',
        epilog='')
    parser.add_argument("path", help="path to the features folder")
    parser.add_argument("benign", help="path to the benign features folder")
    parser.add_argument("threadcount", help="Number of threads", type=int)
    parser.add_argument(
        "benign_list", help="Path to the benign update list")
    parser.add_argument(
        "keywords", help="Path to the list of keyword features")
    parser.add_argument("-dataset", help="Dataset of extensions to extract")
    parser.add_argument("-n", help="Name of the dataset in the dataset file.")
    parser.add_argument("output", help="path to the output file")
    args = parser.parse_args()

    global Benign_List
    with open(args.benign_list, "r", encoding="utf-8") as f:
        Benign_List = set(json.load(f)['prior2023'])

    if args.dataset and args.n:
        with open(args.dataset, "r", encoding="utf-8") as f:
            extensions = json.load(f)[args.n]
        for i, value in enumerate(extensions):
            extensions[i] = value + ".json"
    else:
        extensions = os.listdir(args.path)

    size = int(len(extensions)/args.threadcount)
    threads = [None] * args.threadcount
    queue = Queue()
    for i in range(args.threadcount):
        if i == args.threadcount - 1:
            extension_list = extensions[i*size:len(extensions)]
        else:
            extension_list = extensions[i*size:(i+1)*size]
        threads[i] = Process(target=read_features, args=[
            extension_list, args.path, args.benign, args.keywords, queue])
        threads[i].start()

    features = {}
    for i in range(args.threadcount):
        features.update(queue.get())
        print(i)

    for i in range(args.threadcount):
        threads[i].join()

    with open(args.output, "w", encoding="utf-8") as file:
        file.write(json.dumps(features))


if __name__ == "__main__":
    main()
