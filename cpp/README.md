# cpp

No C++ modules yet. This directory exists so the repo's language layout
(`js/`, `python/`, `c/`, `cpp/`, ...) is stable from the start — add modules
here as they're extracted from consuming projects.

Follow the same shape as the other language directories: one directory per
module (`cpp/<module-name>/`), each with its own `README.md`, no
dependencies beyond the C++ standard library unless the README says
otherwise and justifies why, and no build step required to drop the
module's source directly into a consumer — a CMakeLists.txt or build script
may be included for standalone builds/tests, but the module itself should
build as part of whatever build system consumes it.

See the top-level `AGENTS.md` for the full contribution and submodule
workflow.
