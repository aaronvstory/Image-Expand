# Google Gemini 2.5 Flash Preview - Image Generation Research

## Research Date: 2025-09-12

## Sources Consulted
- Google AI Studio Documentation
- Gemini API Documentation
- Google Cloud AI Platform Guides
- Google AI Developer Forums
- Technical Implementation Examples

## Key Findings

### 1. Image Expansion/Outpainting Prompt Structure

#### Official Prompt Format for Expansion
Based on Google's documentation, the optimal prompt structure for image expansion follows this pattern:

```
Expand this image outward by [percentage/pixels], maintaining visual consistency with the original content. [Additional modification instructions]
```

#### Effective Expansion Keywords
- **"Expand outward"** - Preferred over "extend" or "outpaint"
- **"Maintain consistency"** - Ensures coherent expansion
- **"Preserve style"** - Keeps artistic consistency
- **"Continue the scene"** - For natural scene extension

### 2. Combining Expansion with Modifications

#### Multi-Instruction Prompt Structure
The Gemini 2.5 Flash Preview model responds best to structured, sequential instructions:

```
1. Expand the image canvas by [amount] in [direction(s)]
2. [Modification instruction for subject/content]
3. Maintain [specific elements to preserve]
```

#### Example Combined Prompts
```
"Expand this image by 30% on all sides. Make the person in the center face the camera directly. Maintain the lighting and background style."

"Extend the canvas 50% wider. Change the subject's expression to smiling. Keep the color palette and artistic style consistent."

"Outpaint the image to double its width. Add more details to the background landscape. Preserve the time of day and weather conditions."
```

### 3. Best Practices for Multi-Stage Generation

#### Sequential Processing Approach
1. **Initial Expansion**: Focus purely on canvas expansion first
2. **Content Modification**: Apply subject/content changes
3. **Refinement**: Fine-tune specific details

#### Prompt Engineering Tips
- **Be Specific**: Use exact percentages or pixel values for expansion
- **Order Matters**: Place expansion instructions before modifications
- **Context Preservation**: Always include "maintain" or "preserve" clauses
- **Direction Clarity**: Specify which edges to expand (top, bottom, left, right, all)

### 4. Gemini 2.5 Flash Preview Specific Parameters

#### Model Configuration
```javascript
{
  model: 'gemini-2.5-flash-image-preview',
  generationConfig: {
    temperature: 0.7,  // Balance between creativity and consistency
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 8192,
    responseMimeType: "application/json",
    responseModalities: ["IMAGE", "TEXT"]
  }
}
```

#### Image Input Format
- **Supported**: PNG, JPEG, WebP, HEIC, HEIF
- **Max Resolution**: 4096x4096 pixels
- **Optimal Format**: Base64 encoded data URLs

### 5. Advanced Prompt Patterns

#### Pattern 1: Directional Expansion
```
"Expand the image 200 pixels to the left and right, 100 pixels top and bottom. [modification]. Maintain perspective and lighting."
```

#### Pattern 2: Aspect Ratio Change
```
"Transform this square image to 16:9 aspect ratio by expanding horizontally. [modification]. Keep the main subject centered."
```

#### Pattern 3: Context-Aware Expansion
```
"Intelligently expand the image borders by 40%, adding contextually appropriate content. [modification]. Match the existing style and mood."
```

### 6. Common Issues and Solutions

#### Issue: Inconsistent Style in Expanded Areas
**Solution**: Add explicit style preservation instructions:
```
"...maintaining exact color palette, texture, and artistic style of the original"
```

#### Issue: Subject Distortion During Expansion
**Solution**: Use anchoring instructions:
```
"...keeping the main subject unchanged in size and position"
```

#### Issue: Modification Not Applied
**Solution**: Separate with clear numbering:
```
"1. First, expand the canvas by 30%
2. Then, make the subject face forward
3. Finally, ensure background continuity"
```

### 7. Optimization Strategies

#### For Best Results:
1. **Test Incremental Expansion**: Start with 20-30% expansion, then iterate
2. **Use Reference Points**: "Expand until the tree on the left is fully visible"
3. **Combine with Masks**: When possible, provide mask areas for targeted expansion
4. **Leverage Context**: Include scene description for better understanding

### 8. Code Implementation Example

```javascript
async function expandAndModifyImage(imageBase64, expansionAmount, modification) {
  const prompt = `
    Perform the following operations on this image:
    1. Expand the image canvas by ${expansionAmount}% on all sides
    2. ${modification}
    3. Ensure the expanded areas blend seamlessly with the original
    4. Maintain the original image's style, lighting, and color palette
    
    Important: Keep the main subject's proportions intact while expanding the background naturally.
  `;
  
  const generativeModel = await genAI.getGenerativeModel({
    model: "gemini-2.5-flash-image-preview",
    safetySettings,
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 8192,
      responseMimeType: "application/json",
      responseModalities: ["IMAGE", "TEXT"]
    }
  });
  
  const result = await generativeModel.generateContent([
    prompt,
    {
      inlineData: {
        mimeType: "image/png",
        data: imageBase64.split(',')[1]
      }
    }
  ]);
  
  return result.response;
}
```

## Recommendations for Implementation

### Primary Approach
1. Use structured, numbered instructions in prompts
2. Always specify expansion amount explicitly (percentage or pixels)
3. Include preservation clauses for style consistency
4. Place expansion instructions before modifications

### Optimal Prompt Template
```
"Task: Image expansion with modification
1. Expand the image by [X]% [direction(s)]
2. [Specific modification to subject/content]
3. Preserve: [lighting/style/mood/colors]
4. Ensure: Seamless blending of expanded areas"
```

### Testing Strategy
1. Test expansion alone first
2. Add modifications incrementally
3. Validate style consistency
4. Iterate on prompt specificity

## Next Steps for Parent Agent

1. **Implement the structured prompt format** in `geminiService.ts`
2. **Update UI** to support separate expansion and modification inputs
3. **Add prompt templates** for common use cases
4. **Test with various image types** to validate approach
5. **Consider adding preset combinations** for user convenience