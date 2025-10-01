"""Merges JaSt Features into a single file per dataset."""
import os
import json
import argparse

parser = argparse.ArgumentParser(
    prog='marge_source_code_features',
    description='Merges JaSt Features.',
    epilog='')
parser.add_argument("dataset", help="dataset")
parser.add_argument("datasetName", help="name of dataset in dataset file")
parser.add_argument("features", help="path to features")
parser.add_argument("output", help="output file")
args = parser.parse_args()

with open(args.dataset, "r", encoding="utf-8") as f:
    dataset = json.load(f)[args.datasetName]


merged_features = {}
for extension in dataset:
    path = os.path.join(args.features, f"{extension}.json")
    if not os.path.exists(path):
        continue
    with open(path, "r", encoding="utf-8") as f:
        merged_features.update(json.load(f))

print(len(merged_features))

with open(args.output, "w", encoding="utf-8") as f:
    f.write(json.dumps(merged_features))
