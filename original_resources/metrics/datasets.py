"""Creates Training and Testing datasets according to the last update of extensions."""
import os
import json
import argparse
import random


def sort_extensions(extensions, chrome_stats_data_path):
    """Creates a sorted list of extensions according to their last update."""
    last_update_dict = {}
    for extension in extensions:
        with open(os.path.join(chrome_stats_data_path, extension, "details.json"),
                  "r", encoding="utf-8") as f:
            last_update = json.load(f)["lastUpdate"]
        last_update_dict[extension] = last_update
    return sorted(last_update_dict.items(), key=lambda item: item[1])


def split(sorted_extensions, split_at=0.8, year=None, set1_name="trainingsSet", set2_name="testSet"):
    """Splits a sorted list of extensions into Training and Testing set."""
    if year is not None:
        print(f"{set1_name}:\
             {len([extension for extension, date in sorted_extensions if int(date[:4]) < year])}")
        print(f"{set2_name}:\
             {len([extension for extension, date in sorted_extensions if int(date[:4]) == year])}")
        return {
            set1_name: [extension for extension, date in sorted_extensions if int(date[:4]) < year],
            set2_name:
            [extension for extension, date in sorted_extensions if int(date[:4]) == year]}
    splitpoint = int(len(sorted_extensions) * split_at)
    return {
        set1_name: [extension for extension, _ in sorted_extensions[:splitpoint]],
        set2_name: [extension for extension, _ in sorted_extensions[splitpoint:]], }


def main():
    """Creates Training and Testing datasets according to the last update of extensions
        for a list of extensions."""
    parser = argparse.ArgumentParser(
        prog='datasets',
        description='Creates two datasets.',
        epilog='')
    parser.add_argument(
        "unpacked_path", help="path to the unpacked extensions directory")
    parser.add_argument(
        "details_path", help="path to the directory containing the chrome-stats details")
    parser.add_argument("output", help="path to the output file")
    parser.add_argument(
        "-y", help="The year that splits the two sets", default=None, type=int)
    parser.add_argument("-yl", "--year_limit", dest='yl', help="Only extensions with the last update before\
                         this year are considered", default=None, type=int)
    parser.add_argument(
        "-p", help="Percentage of the size of the first set", default=0.8)
    parser.add_argument(
        "-s", help="Should the list of extensions be shuffled", action="store_true")
    parser.add_argument(
        "-name1", help="Name of the first set", default="trainingsSet")
    parser.add_argument(
        "-name2", help="Name of the first set", default="testSet")
    args = parser.parse_args()

    extensions = sort_extensions(os.listdir(args.unpacked_path),
                                 args.details_path)
    if args.yl:
        extensions = [extension for extension in extensions if int(
            extension[1][:4]) < args.yl]
    if args.s:
        random.shuffle(extensions)
    sets = split(extensions, split_at=args.p, year=args.y,
                 set1_name=args.name1, set2_name=args.name2)
    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(sets, f)


if __name__ == "__main__":
    main()
