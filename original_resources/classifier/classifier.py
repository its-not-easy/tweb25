"""Classifies the extensions using Randon Forest and extimates the optimal threshold value."""
import json
import math
import random
import argparse
from datetime import datetime
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, confusion_matrix


def prepare_data(path: str, x: list, y: list, class_name: str, feature_names=None):
    """Loads features from json file."""
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    for _, extension in data.items():
        if isinstance(extension, list):
            x.append(extension)
        else:
            x.append(list(extension.values()))
            if feature_names == []:
                feature_names.extend(list(extension.keys()))
        y.append(class_name)


def classify(x_test, y_test, model, threshold=0.5):
    """Classifies the data with the given threshold value."""
    start = datetime.now()
    probabilities = model.predict_proba(x_test)
    print(
        f"Classification time for {len(x_test)} samples: f{datetime.now()- start}")
    y_pred = []
    for prob in probabilities:
        if prob[0] >= threshold:
            y_pred.append("benign")
        else:
            y_pred.append("malware")
    cm = confusion_matrix(y_test, y_pred)
    accuracy = accuracy_score(y_test, y_pred)
    print(cm)
    print(f"Accuracy: {accuracy}")


def split_into_sections(n: int, x: list):
    """Splits a list into n lists."""
    sections = [None] * n
    sections_size = math.ceil(len(x)/n)
    for i in range(n):
        if i == n-1:
            sections[i] = x[i*sections_size:len(x)]
        else:
            sections[i] = x[i*sections_size:(i+1)*sections_size]
    return sections


def calculate_threshold(probabilities, labels):
    """Calculates the optimal threshold."""
    threshold = 0.0
    best_threshold = [0.0, 2.0]
    total_benign = 0
    total_malware = 0
    data = {}
    for label in labels:
        if label == "benign":
            total_benign += 1
        else:
            total_malware += 1
    while threshold <= 1.0:
        prediction = []
        false_benign = 0
        false_malware = 0
        for i, prob in enumerate(probabilities):
            if prob[0] > threshold:
                prediction.append("benign")
                if labels[i] != "benign":
                    false_benign += 1
            else:
                prediction.append("malware")
                if labels[i] != "malware":
                    false_malware += 1
        false_malware_rate = false_malware / total_benign
        false_benign_rate = false_benign / total_malware
        rate = false_benign_rate + false_malware_rate
        data[threshold] = (false_malware_rate, false_benign_rate)
        if rate < best_threshold[1]:
            best_threshold = [threshold, rate]
        threshold += 0.01
    return best_threshold[0], data


def n_fold_cross_validation(n: int, x_benign: list, x_malware: list, model):
    """Uses n-fold cross-validation to estimate the optimal threshold value."""
    x_benign = x_benign.copy()
    random.Random(1).shuffle(x_benign)
    x_malware = x_malware.copy()
    random.Random(1).shuffle(x_malware)

    benign_sections = split_into_sections(n, x_benign)
    malware_sections = split_into_sections(n, x_malware)

    sum_threshold = 0
    for i in range(n):
        x_train, y_train, x_test, y_test = [], [], [], []
        for j in range(n):
            if i == j:
                x = x_test
                y = y_test
            else:
                x = x_train
                y = y_train
            x.extend(benign_sections[j])
            y.extend(["benign"] * len(benign_sections[j]))
            x.extend(malware_sections[j])
            y.extend(["malware"] * len(malware_sections[j]))
        model.fit(x_train, y_train)

        threshold, _ = calculate_threshold(model.predict_proba(x_test), y_test)

        sum_threshold += threshold

    return sum_threshold / n


def feature_importance(model, feature_names):
    """Prints the importance of each feature"""
    feature_use = model.feature_importances_
    feature_dict = {}
    for i, feature in enumerate(feature_use):
        feature_dict[feature_names[i]] = feature
    feature_list = sorted(feature_dict.items(), key=lambda x: x[1])
    i = len(feature_list)
    for feature in feature_list:
        print(f"{i}. {feature}")
        i -= 1


def main():
    """Parses cmd line arguments"""
    parser = argparse.ArgumentParser(
        prog='classifier',
        description='Classify browser extensions.',
        epilog='')
    parser.add_argument(
        "benign_train", help="path to the benign training dataset file")
    parser.add_argument(
        "malware_train", help="path to the malware training dataset file")
    parser.add_argument("test_set", help="path to a test dataset file")
    parser.add_argument(
        "test_label", help="label of the test dataset (benign/malware)")
    parser.add_argument(
        "-test_set1", help="path to a the additional test dataset file")
    parser.add_argument(
        "-test_label1", help="label of the additional test dataset (benign/malware)")
    parser.add_argument("-t", help="the threshold value that should be used")
    parser.add_argument("-fi", help="should the feature importance be printed. \
                        (Does not work for the source code classifer)", action='store_true',
                        default=False)
    args = parser.parse_args()

    x_train_benign, x_train_malware = [], []
    x_train, x_test, y_train, y_test = [], [], [], []
    feature_names = None
    if (args.fi):
        feature_names = []

    prepare_data(args.benign_train, x_train_benign,
                 y_train, "benign", feature_names)
    prepare_data(args.malware_train, x_train_malware, y_train, "malware")

    prepare_data(args.test_set, x_test, y_test, args.test_label)

    if args.test_set1 and args.test_label1:
        prepare_data(args.test_set1, x_test, y_test, args.test_label1)

    x_train = x_train_benign.copy()
    x_train.extend(x_train_malware)

    model = RandomForestClassifier(n_estimators=300, max_features="sqrt", criterion="gini",
                                   n_jobs=16, class_weight="balanced", random_state=1)
    start = datetime.now()

    threshold = 0
    if not args.t:
        if len(x_train_benign) < 5 or len(x_train_malware) < 5:
            print("At least 5 extensions of each class are requiered to perform 5-fold cross-validation!")
            exit()
        threshold = n_fold_cross_validation(
            5, x_train_benign, x_train_malware, model)
        print(f"Threshold estimation Time: f{datetime.now()- start}")
        print(f"Threshold: {1 - threshold}")
    else:
        threshold = 1 - float(args.t)

    start = datetime.now()
    model.fit(x_train, y_train)
    print(f"Training time: f{datetime.now()- start}")

    if args.fi:
        feature_importance(model, feature_names)
    classify(x_test, y_test, model, threshold)


if __name__ == "__main__":
    main()
