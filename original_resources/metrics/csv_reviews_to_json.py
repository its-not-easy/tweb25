"""This scripts converts the reviews in a csv file to reviews in a json file
 ordered by the extension ids"""
import csv
import json
import sys
import argparse

csv.field_size_limit(sys.maxsize)


def convert_csv(path, output):
    """Converts the csv to a json file."""
    reviews = {}
    with open(path, newline='', encoding="utf-8") as f:
        csvreader = csv.DictReader(f)

        for row in csvreader:
            if row['id'] in reviews:
                reviews[row['id']].append(row['body'])
            else:
                reviews[row['id']] = [row['body']]

    with open(output, "w", encoding="utf-8") as f:
        json.dump(reviews, f)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        prog='csv_reviews_to_json',
        description='Converts the reviews in a csv file to reviews in a json file.',
        epilog='')
    parser.add_argument(
        "path", help="path to the csv file containing the reviews")
    parser.add_argument("output", help="path to the output file")
    args = parser.parse_args()

    convert_csv(args.path, args.output)
