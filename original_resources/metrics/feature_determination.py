"""Determinies which Keywords, Host-Permissions and Content-Script-Matches should \
    be usesd as features"""
import json
import argparse
import os


def calculate_relative_frequency(dataset: str, features_path: str,
                                 output_path: str):
    """Calculates the relative freaquency of Keywords, Host Permissions, \
        and Content Script Matches of the Trainings Set."""
    with open(dataset, "r", encoding="utf-8") as f:
        extensions = json.load(f)["trainingsSet"]
    features = {"description": {}, "fullSummary": {}, "reviews": {},
                "hostPermissions": {}, "contentScriptMatches": {}}
    for extension in extensions:
        with open(os.path.join(features_path, extension + ".json"), "r", encoding="utf-8") as f:
            data = json.load(f)
        for category, _ in features.items():
            if category in data:
                elements = []
                if isinstance(data[category], dict):
                    elements = data[category].keys()
                elif isinstance(data[category], list):
                    elements = data[category]
                for element in elements:
                    if element in features[category]:
                        features[category][element] += 1
                    else:
                        features[category][element] = 1
    output = {}
    for category, _ in features.items():
        output[category] = {}
        for keyword, value in features[category].items():
            value = value / len(extensions)
            output[category][keyword] = value
        output[category] = sorted(
            output[category].items(), key=lambda x: x[1], reverse=True)

    with open(output_path, "w", encoding="utf-8") as f:
        f.write(json.dumps(output))
    return output


def main():
    """Main function parsing arguments and getting the top 400."""
    parser = argparse.ArgumentParser(
        prog='feature_determination',
        description='Determinies which Keywords, Host-Permissions and \
      Content-Script-Matches should be usesd as features.',
        epilog='')
    parser.add_argument("benign", help="path to the benign dataset file.")
    parser.add_argument("malware", help="path to the malware dataset file.")
    parser.add_argument("features", help="path to the metadata features directory.")
    parser.add_argument("-n_desc", help="The number of \
                        description keywords that should be used as features.",
                        default=400, )
    parser.add_argument("-n_summ", help="The number of \
                        summary keywords that should be used as features.",
                        default=400)
    parser.add_argument("-n_rev", help="The number of \
                        review keywords that should be used as features.",
                        default=400)
    parser.add_argument("-n_host", help="The number of \
                        host-permission patterns that should be used as features.",
                        default=400)
    parser.add_argument("-n_content", help="The number of \
                        content-script-match patterns that should be used as features.",
                        default=400)
    parser.add_argument("output", help="output directory.")
    args = parser.parse_args()

    numbers = {"description": float(args.n_desc),
                  "fullSummary": float(args.n_summ),
                  "reviews": float(args.n_rev),
                  "hostPermissions": float(args.n_host),
                  "contentScriptMatches": float(args.n_content)}

    if not os.path.exists(args.output):
        os.makedirs(args.output)
    features = calculate_relative_frequency(args.benign, os.path.join(args.features, "benign"),
                                            os.path.join(args.output, "benign.json"))
    malware_features = calculate_relative_frequency(args.malware,
                                                    os.path.join(
                                                    args.features, "malware"),
                                                    os.path.join(args.output, "malware.json"))

    results = {}

    for category, _ in features.items():
        i_benign, i_malware = 0, 0
        elements = set()
        while len(elements) < numbers[category]:
            if i_malware >= len(malware_features[category]) \
                and i_benign > len(features[category]):
                break
            elif i_malware >= len(malware_features[category]):
                elements.add(benign[0])
                i_benign += 1
            elif i_benign > len(features[category]):
                elements.add(malware[0])
                i_malware += 1
            else:
                benign = features[category][i_benign]
                malware = malware_features[category][i_malware]
                if benign[1] > malware[1]:
                    elements.add(benign[0])
                    i_benign += 1
                else:
                    elements.add(malware[0])
                    i_malware += 1
        print(f"{category} {i_benign} {i_malware}")
        results[category] = list(elements)

    with open(os.path.join(args.output, "results.json"), "w", encoding="utf-8") as f:
        f.write(json.dumps(results))


if __name__ == "__main__":
    main()
