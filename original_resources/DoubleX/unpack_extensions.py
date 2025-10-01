# Copyright (C) 2021 Aurore Fass and Ben Stock
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as published
# by the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public License
# along with this program.  If not, see <https://www.gnu.org/licenses/>.

"""
    Unpacking a Chrome extension and extracting the different components.
    
    We slightly modified this file to obtain additional information and to
    concatenate service workers (background script) with content scripts.
"""

import os
import json
import logging
import fnmatch
import hashlib
import argparse
from urllib.parse import urljoin
from multiprocessing import Process
from zipfile import ZipFile, BadZipFile
from bs4 import BeautifulSoup


def read_from_zip(zf, filename):
    """ Returns the bytes of the file filename in the archive zf. """

    filename = filename.lstrip("./").split("?")[0]

    try:
        return zf.read(filename)

    except KeyError:
        # Now try lowercase
        mapping = {}
        for zi in zf.infolist():
            mapping[zi.filename.lower()] = zi.filename
        if filename.lower() in mapping:
            return zf.read(mapping[filename.lower()])
        logging.exception(zf.filename, filename, 'KeyError')
        return b''

    except Exception as e:
        logging.exception(f"{zf.filename}, {filename}, {e}")
        return b''


def beautify_script(content, suffix):
    """ Beautifies a script with js-beautify (https://www.npmjs.com/package/js-beautify). """
    filehash = hashlib.md5(content.encode()).hexdigest()
    temp_file = "/tmp/%s_%s" % (filehash, suffix.replace("/", "_"))

    with open(temp_file, "w") as fh:
        fh.write(content)
    os.system("js-beautify -t -r %s > /dev/null" % temp_file)

    with open(temp_file, "r") as fh:
        content = fh.read()
    os.unlink(temp_file)

    return content


def pack_and_beautify(extension_zip, scripts, extension_scripts=None):
    """ Appends and beautifies the content of scripts. """

    all_content = ""
    script_count = 0

    for script in scripts:
        if not extension_scripts is None and script in extension_scripts:
            extension_scripts.remove(script)
        if "jquery" in script.lower() or \
            not script.endswith(".js") or \
                script.startswith("https://") \
                or script.startswith("https://") or \
                "jq.min.js" in script.lower() or \
                "jq.js" in script.lower():
            continue
        content = read_from_zip(extension_zip, script)
        if len(content):
            pass
        else:
            continue
        script_count += 1
        all_content += "// New file: %s\n" % script
        all_content += "{\n"
        content = content.replace(b"use strict", b"")
        content = content.replace(b"...", b"")
        all_content += beautify_script(content.decode("utf8",
                                       "ignore"), extension_zip.filename) + "\n"
        all_content += "}\n"

    return all_content, script_count


def get_all_content_scripts(manifest, extension_zip, extension_scripts):
    """ Extracts the content scripts. """

    content_scripts = manifest.get("content_scripts", [])

    all_scripts = list()
    for entry in content_scripts:
        if not isinstance(entry, dict):
            continue
        for script in entry.get("js", []):
            scriptname = script if script.startswith(
                "/") or not "/" in script else "/" + script
            if scriptname not in all_scripts:
                all_scripts.append(scriptname)

    return pack_and_beautify(extension_zip, all_scripts, extension_scripts)


def get_all_background_scripts_v2(manifest, extension_zip, extension_scripts):
    """ Extracts the background scripts if manifest version 2. """

    background = manifest.get("background")

    if not background or not isinstance(background, dict):
        return "", 0

    all_scripts = list()
    inline_scripts = ""

    for script in background.get("scripts", []):  # Background scripts
        if not isinstance(script, str):
            continue
        scriptname = script if script.startswith(
            "/") or not "/" in script else "/" + script
        if scriptname not in all_scripts:
            all_scripts.append(scriptname)

    page = background.get("page")  # Background page
    if page:
        content = read_from_zip(
            extension_zip, page.split("?")[0].split("#")[0])
        soup = BeautifulSoup(content, features="html.parser")
        for script in soup.find_all("script"):
            if "src" in script.attrs:
                src_path = urljoin(page, script["src"])
                scriptname = src_path if src_path.startswith(
                    "/") or not "/" in src_path else "/" + src_path
                if scriptname not in all_scripts:
                    all_scripts.append(scriptname)
            elif script.string:
                inline_scripts += "// New inline (from %s)\n" % background
                inline_scripts += beautify_script(script.string,
                                                  extension_zip.filename) + "\n"

    return pack_and_beautify(extension_zip, all_scripts, extension_scripts)


def get_all_background_scripts_v3(manifest, extension_zip, extension_scripts):
    """ Extracts the background scripts if manifest version 3. """

    background = manifest.get("background")

    if not background or not isinstance(background, dict):
        return "", 0

    all_scripts = list()
    script = background.get("service_worker", -1)
    if isinstance(script, str):
        scriptname = script if script.startswith(
            "/") or not "/" in script else "/" + script
        if scriptname not in all_scripts:
            all_scripts.append(scriptname)

    return pack_and_beautify(extension_zip, all_scripts, extension_scripts)


def get_wars_v2(manifest, extension_zip, extension_scripts):
    """ Extracts the web accessible resources if manifest version 2. """

    all_scripts = set()
    war_scripts = ""

    if "web_accessible_resources" in manifest:
        try:
            background_page = manifest.get("background", {}).get("page")
        except AttributeError:
            background_page = None
        for contained_file in extension_zip.namelist():
            for whitelisted in manifest["web_accessible_resources"]:
                if fnmatch.fnmatch(contained_file, whitelisted) and ".htm" in contained_file \
                        and contained_file != background_page:
                    content = extension_zip.read(contained_file)
                    soup = BeautifulSoup(content, features="html.parser")
                    scripts = soup.find_all("script")
                    for script in scripts:
                        if "src" in script.attrs:
                            script_src = urljoin(
                                contained_file, script["src"].split("?")[0].split("#")[0])
                            all_scripts.add(script_src)
                        elif script.string:
                            war_scripts += "// New inline (from %s)\n" % contained_file
                            war_scripts += beautify_script(
                                script.string, extension_zip.filename) + "\n"

    scripts, script_count = pack_and_beautify(
        extension_zip, all_scripts, extension_scripts)

    return war_scripts + scripts, script_count


def get_wars_v3(manifest, extension_zip, extension_scripts):
    """ Extracts the web accessible resources if manifest version 3. """

    all_scripts = set()
    war_scripts = ""

    if "web_accessible_resources" in manifest:
        try:
            background_page = manifest.get("background", {}).get("page")
        except AttributeError:
            background_page = None
        whitelisted_list = set()
        for el in manifest["web_accessible_resources"]:
            if 'resources' in el:
                for res in el['resources']:
                    whitelisted_list.add(res)
        for contained_file in extension_zip.namelist():
            for whitelisted in whitelisted_list:
                if fnmatch.fnmatch(contained_file, whitelisted) and ".htm" in contained_file \
                        and contained_file != background_page:
                    content = extension_zip.read(contained_file)
                    soup = BeautifulSoup(content, features="html.parser")
                    scripts = soup.find_all("script")
                    for script in scripts:
                        if "src" in script.attrs:
                            script_src = urljoin(
                                contained_file, script["src"].split("?")[0].split("#")[0])
                            all_scripts.add(script_src)
                        elif script.string:
                            war_scripts += "// New inline (from %s)\n" % contained_file
                            war_scripts += beautify_script(
                                script.string, extension_zip.filename) + "\n"

    scripts, script_count = pack_and_beautify(
        extension_zip, all_scripts, extension_scripts)

    return war_scripts + scripts, script_count


def unpack_extension(extension_crx, dest):
    """
    Call this function to extract the manifest, content scripts, background scripts, and WARs.

    :param extension_crx: str, path of the packed extension to unpack;
    :param dest: str, path where to store the extracted extension components.
    """

    extension_id = os.path.basename(extension_crx).split('.crx')[0]
    dest = os.path.join(dest, extension_id)

    try:
        extension_zip = ZipFile(extension_crx)
        manifest = json.loads(read_from_zip(extension_zip, "manifest.json"))
    except BadZipFile:
        logging.error(f"BadZipFile: Zipfile of {extension_id} is invalid.")
        return
    except json.JSONDecodeError:
        logging.error(
            f"JSONDecodeError: Manifest of extension {extension_id} cound not be read.")
        return
    except Exception as e:
        logging.error(f"{type(e)} Unexpected Exception {extension_id}.")
        exit()
        return

    manifest_version = manifest.get("manifest_version", -1)
    if manifest_version not in (2, 3):
        logging.error(
            f'Only unpacking extensions with manifest version 2 or 3. {extension_id}')
        # Considering only extensions with manifest versions 2 or 3
        return

    file_count = 0
    js_files = []
    js_files_size = 0
    js_file_count = 0

    for file in extension_zip.infolist():
        file_count += 1
        if (file.filename.endswith(".js")):
            filename = file.filename if file.filename.startswith(
                "/") or not "/" in file.filename else "/" + file.filename
            js_files.append(filename)
            js_files_size += file.file_size
            js_file_count += 1

    content_scripts, content_scripts_count = get_all_content_scripts(
        manifest, extension_zip, js_files)
    if manifest_version == 2:
        backgrounds, backgrounds_count = get_all_background_scripts_v2(
            manifest, extension_zip, js_files)
    else:
        backgrounds, backgrounds_count = get_all_background_scripts_v3(
            manifest, extension_zip, js_files)

    if manifest_version == 2:
        _, wars_count = get_wars_v2(manifest, extension_zip, js_files)
    else:
        _, wars_count = get_wars_v3(manifest, extension_zip, js_files)

    _, other_js_count = pack_and_beautify(extension_zip, js_files, None)

    if content_scripts_count + backgrounds_count == 0:
        logging.error(f"{extension_id} does not contain js.")
        return

    if "theme" in manifest and content_scripts_count + backgrounds_count == 0:
        # Remove the themes
        logging.error(f"Theme extension {extension_id} not unpacked.")
        return

    if not os.path.exists(dest):
        os.makedirs(dest)

    with open(os.path.join(dest, "manifest.json"), "w") as fh:
        fh.write(json.dumps(manifest, indent=2))

    scripts = "//--- Content Scripts: ---\n" + content_scripts \
        + "\n//--- Background Scripts: ---\n" + backgrounds
    with open(os.path.join(dest, "scripts.js"), "w") as fh:
        fh.write(scripts)

    with open(os.path.join(dest, "count.json"), "w") as fh:
        fh.write(json.dumps({'js-size': js_files_size, 'file_count': file_count,
                             'js_file_count': js_file_count, 'content_scripts_count': content_scripts_count,
                             'background_scripts_count': backgrounds_count, 'wars_count': wars_count,
                             'other_js_count': other_js_count}, indent=2))

    logging.info('Extracted the components of %s in %s', extension_crx, dest)


def extract_all(crx_path):
    """ Debug. """

    extension_zip = ZipFile(crx_path)
    extension_zip.extractall()


def start(extensions, src, dst):
    for extension_dir in extensions:
        dir_path = os.path.join(src, extension_dir)
        if os.path.isdir(dir_path):
            unpack_extension(extension_crx=os.path.join(
                dir_path, f"{extension_dir}.crx"), dest=dst)


def main():
    """ Parsing command line parameters. """

    parser = argparse.ArgumentParser(prog='unpack',
                                     formatter_class=argparse.RawTextHelpFormatter,
                                     description="Unpacks a Chrome extension (if manifest v2 or v3)"
                                                 " and extracts its manifest, content scripts, "
                                                 "background scripts/page, and WARs")

    parser.add_argument("-s", "--source", dest='s', metavar="path", type=str,
                        required=False, help="path of the packed extension to unpack")
    parser.add_argument("-d", "--directory", dest='d', metavar="path", type=str,
                        required=False, help="path of the folder of extensions to unpack")
    parser.add_argument("-t", "--threadcount", dest='t', type=str, default=1,
                        required=False, help="Amount of threads that should be used to unpack extensions.")
    parser.add_argument("-d", "--destination", dest='d', metavar="path", type=str,
                        required=True, help="path where to store the extracted extension components"
                                            " (note: a specific folder will be created)")

    args = parser.parse_args()

    if args.s:
        unpack_extension(extension_crx=args.s, dest=args.d)
    elif args.d:
        threadcount = int(args.t)
        extensions = os.listdir(args.d)
        size = int(len(extensions)/threadcount)
        threads = [None] * threadcount
        for i in range(threadcount):
            if i < threadcount - 1:
                extension_list = extensions[i*size:(i+1)*size]
            else:
                extension_list = extensions[i*size:]
            threads[i] = Process(target=start, args=[
                extension_list, args.d, args.d])
            threads[i].start()

        for i in range(threadcount):
            threads[i].join()


if __name__ == "__main__":
    main()
