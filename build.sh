version=$(cat ./VERSION)
filename="extension-$version.zip"

if ! [[ -d ./dist ]]; then
  mkdir dist
fi

zip -r dist/$filename src/ icons/ manifest.json