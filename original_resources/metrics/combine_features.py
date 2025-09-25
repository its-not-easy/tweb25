"""Combines Metadata and Source Code Features into a single file per dataset."""
import json
import argparse

parser = argparse.ArgumentParser(
    prog='combine_features',
    description='Combines Metadata and Source Code Features.',
    epilog='')
parser.add_argument("metadata_features", help="path to the metadata features dataset")
parser.add_argument("source_code_features", help="path to the metadata features dataset")
parser.add_argument("output", help="output file")
args = parser.parse_args()

with open(args.metadata_features, "r", encoding="utf-8") as f:
    dataMetadata = json.load(f)

with open(args.source_code_features, "r", encoding="utf-8") as f:
    dataJaSt = json.load(f)

combined = {}

for key, value in dataJaSt.items():
    features = {}
    for i, feature in enumerate(value):
        features[i] = feature
    features.update(dataMetadata[key])
    combined[key] = features

with open(args.output, "w", encoding="utf-8") as f:
    f.write(json.dumps(combined))
