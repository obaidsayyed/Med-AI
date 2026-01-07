import pandas as pd

# Load datasets
df1 = pd.read_csv(r"C:\Users\Nilofer Sheikh\OneDrive\Desktop\obaid dataset\symptom_disease_dataset.csv")
df2 = pd.read_csv(r"C:\Users\Nilofer Sheikh\OneDrive\Desktop\obaid dataset\symptom_disease_dataset2.csv")
df3 = pd.read_csv(r"C:\Users\Nilofer Sheikh\OneDrive\Desktop\obaid dataset\symptom_disease_dataset3.csv")

# Concatenate row-wise
final_df = pd.concat([df1, df2, df3], axis=0)

# Shuffle to remove ordering bias
final_df = final_df.sample(frac=1, random_state=42).reset_index(drop=True)

# Save final dataset
final_df.to_csv("final_symptom_disease_dataset.csv", index=False)

print("Final dataset created")
print("Shape:", final_df.shape)
print(final_df["disease"].value_counts())
