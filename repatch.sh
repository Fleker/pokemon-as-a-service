HASH_FROM=$1
HASH_TO=$2
git diff $HASH_FROM $HASH_TO > tmp.patch
cd ../pokemon-as-a-service
git apply ../pokemon-of-the-week/tmp.patch
git add .
git commit