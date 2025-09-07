# AI-griculture: AI-powered farmer's dashboard leveraging satellite imagery and environmental data

**AI-griculture** is a **farmer’s dashboard** web app, allowing users to click locations on the world map to **instantly** retrieve important **geospatial insights** about the location, such as **rainfall**, **vegetation health**, and **soil moisture levels**.

The app also uses an **AI agent** to give **actionable advice** on **crop health**, **yield risks**, and more, using **historical data** to provide context for each location.

The user can also **provide their own context** describing their field, crop, situation or plans, helping the agent **tailor its recommendations**!

This product was built and pitched by a **team of five** at the **AI Forum Hackathon 2025**. 


## 🎥 Demo Videos
[Map and metrics demo](https://github.com/user-attachments/assets/814f2315-f6cf-49de-b440-49ac031cd216)

[AI suggestions demo](https://github.com/user-attachments/assets/b8cf8d49-7122-497c-a310-14a34bdf1495)

## ✨ What you can do

- 🗺️ **Click a location** to fetch local metrics (rainfall, NDVI, soil moisture).
- 🤖 **Add your field context** (crop, growth stage, situation, etc).
- 🧭 **Get actionable suggestions** (do/avoid) that cite the relevant metrics.



## 🧩 How it works

1. **Map click → geo lookup** (latitude/longitude).
2. **Data retrieval** for your location and surrounding areas (rainfall, NDVI, soil moisture).
3. **Context fusion** with your field notes (crop, stage, constraints).
4. **AI agent** produces do/avoid recommendations with numeric justifications.


## 🙌 Acknowledgments

We thank AUT, SheSharp, and AI Forum for organising this hackathon!

Geospatial datasets were accessed via the **Google Earth Engine** API, where metrics are originally derived from **satellite imagery**, **model/reanalysis products**, etc.

We thank the original data providers, and Google Earth Engine for hosting these datasets.
