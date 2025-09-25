"""Unpacks the extension archive files (crx) using DoubleX's unpack_extensions
and concatenates content scripts with service workers (background scripts)"""
import argparse
import os
from DoubleX import unpack_extensions


def main():
    """Unpacks the extension archive files (crx, or zip) using DoubleX's unpack_extensions
    and concatenates content scripts with service workers (background scripts)"""
    parser = argparse.ArgumentParser(
        prog='unpack',
        description='Unpacks extensions.',
        epilog='')

    parser.add_argument("extensions", help="path to the folder containing\
                         the downloaded extensions")
    parser.add_argument("output", help="path to the output folder")
    args = parser.parse_args()

    extensions = os.listdir(args.extensions)

    for extension in extensions:
        unpack_extensions.unpack_extension(os.path.join(args.extensions,
                                                        extension, f"{extension.crx}"),
                                           os.path.join(args.output))


if __name__ == "__main__":
    main()
