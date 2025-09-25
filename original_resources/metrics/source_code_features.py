"""Uses JaSt to extract features from the source code of extensions
(concatenated service worker and content scripts)"""
import argparse
import logging
from multiprocessing import Process
import os
import json
from JaSt.features import static_analysis


def extension_analysis(extensions: list, index: int, main_path: str, output_path: str, failed_path: str):
    """Extracts JaSt features for an extension and stores them in a json file."""
    failed_list = []
    for extension in extensions:
        _, feature, label = static_analysis.main_analysis(None, [os.path.join(main_path,
                                                                extension, "scripts.js")],
                                                          ["True"], None, 4, "true", True)
        if not label:
            failed_list.append(extension)
            logging.error(extension)
            continue
        with open(os.path.join(output_path, f"{extension}.json"), "w", encoding="utf-8") as file:
            file.write(json.dumps({extension: feature[0].tolist()}))

    with open(os.path.join(failed_path, f"failed_{index}.json"), "w", encoding="utf-8") as file:
        file.write(json.dumps(failed_list))


def main():
    """Parses cmd line arguments and starts JaSt feature extraction."""
    parser = argparse.ArgumentParser(prog='source_code_features',
                                     formatter_class=argparse.RawTextHelpFormatter,
                                     description="Uses JaSt to extract features from the source \
                                     code of extensions (concatenated service worker\
                                     and content scripts)")

    parser.add_argument("directory", type=str, help="path of the directory containing\
                              the unpacked extensions")
    parser.add_argument("-t", "--threadcount", dest='t', type=str, default=1,
                        help="Amount of threads that should be used\
                              to unpack extensions.")
    parser.add_argument("output", type=str,
                        help="path where to store the extracted JaSt\
                              features extension components.")
    parser.add_argument("log", type=str,
                        help="path to the log file.")
    parser.add_argument("failed", type=str,
                        help="path to the directory containing the\
                              list of failed extensions.")

    args = parser.parse_args()

    logging.basicConfig(
        filename=args.log, level=logging.WARNING)

    main_path = args.directory
    output_path = args.output
    failed_path = args.failed
    threadcount = int(args.t)

    if not os.path.exists(output_path):
        os.makedirs(output_path)
    
    if not os.path.exists(failed_path):
        os.makedirs(failed_path)

    extensions = os.listdir(main_path)

    size = int(len(extensions)/threadcount)
    threads = [None] * threadcount
    for i in range(threadcount):
        if i < threadcount - 1:
            extension_list = extensions[i*size:(i+1)*size]
        else:
            extension_list = extensions[i*size:]
        threads[i] = Process(target=extension_analysis, args=[
            extension_list, i, main_path, output_path, failed_path])
        threads[i].start()

    for i in range(threadcount):
        threads[i].join()


if __name__ == "__main__":
    main()
