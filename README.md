# Prefect
City builder game, inspired by Caesar III mechanics

[Live Demo page](https://costas-basdekis.github.io/Prefect/)

This an attempt to reproduce Caesar III mechanics. Hopefully it will be possible to play a full game!

# SVG screenshot
![](demo.svg?raw=true&sanitize=true)

# Technical
This is build on React and Redux, purely with SVG, since it seems to be such a
nice declarative framework, and SVG is natural to use. So far it seems to make
things easy.

If you have any suggestions let me know.

# Current features
* [x] Display a grid with various types of terrain
* [x] Have a toolbox
* [x] Select tiles according to toolbox selection type
* [x] Make roads and clear tools work
* [x] Add houses
* [x] Implement newcomers, and house level and occupancy
* [x] People that seek workers on the streets
* [x] Find workers on the street

# Working on
* [ ] Service workers

# Next features
* [ ] Determine worker percentage
* [ ] Allocate workers via available workers
* [ ] Allocate workers per industry
* [ ] Proper demographics
* [ ] Fire & damage
* [ ] Reservoirs and fountains
* [ ] Farms, granaries, markets
* [ ] Service workers
* [ ] Goods deliverers and seekers
* [ ] Map editor
* [ ] Procedural random map generation
